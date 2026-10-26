const supabase = require('../config/supabase');
const invoiceService = require('./invoice.service');

class PaymentService {
  /**
   * Helper to calculate final amount after discount and tax.
   */
  getFinalAmount(payment) {
    const amount = parseFloat(payment.amount || 0);
    const discount = parseFloat(payment.discount || 0);
    const tax = parseFloat(payment.tax || 0);
    return parseFloat((amount - discount + tax).toFixed(2));
  }

  async getAllPayments({ page = 1, limit = 10, search, payment_status, payment_method, member, sortBy = 'newest' }) {
    const fromIndex = (parseInt(page) - 1) * parseInt(limit);
    const toIndex = fromIndex + parseInt(limit) - 1;

    let query = supabase
      .from('payments')
      .select('*, member:members(*), membership:memberships(*)', { count: 'exact' });

    // Apply search filter (by invoice number)
    if (search) {
      query = query.ilike('invoice_number', `%${search}%`);
    }

    // Apply payment status filter
    if (payment_status) {
      query = query.eq('payment_status', payment_status);
    }

    // Apply payment method filter
    if (payment_method) {
      query = query.eq('payment_method', payment_method);
    }

    // Apply member filter (member_id)
    if (member) {
      query = query.eq('member_id', member);
    }

    // Apply sorting
    if (sortBy === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply range pagination
    query = query.range(fromIndex, toIndex);

    const { data, count, error } = await query;
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Map payments to include virtual final_amount
    const payments = (data || []).map(p => ({
      ...p,
      final_amount: this.getFinalAmount(p)
    }));

    return {
      payments,
      pagination: {
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: count ? Math.ceil(count / parseInt(limit)) : 0
      }
    };
  }

  async getPaymentById(id) {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*, member:members(*), membership:memberships(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!payment) {
      throw new Error('Payment not found.');
    }

    return {
      ...payment,
      final_amount: this.getFinalAmount(payment)
    };
  }

  async createPayment(data) {
    const { member_id, membership_id, amount, currency, discount, tax, payment_method, payment_status, notes, receipt_url } = data;

    // 1. Verify member exists
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id')
      .eq('id', member_id)
      .maybeSingle();

    if (memberError) {
      throw new Error(`Database error: ${memberError.message}`);
    }
    if (!member) {
      throw new Error('Member not found.');
    }

    // 2. Verify membership exists if membership_id is provided
    if (membership_id) {
      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .select('id')
        .eq('id', membership_id)
        .maybeSingle();

      if (membershipError) {
        throw new Error(`Database error: ${membershipError.message}`);
      }
      if (!membership) {
        throw new Error('Membership not found.');
      }
    }

    // 3. Generate a unique invoice number
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${Date.now()}-${randomSuffix}`;

    // 4. Store automatically payment_date
    const paymentDate = new Date().toISOString();

    // 5. Insert payment
    const { data: newPayment, error: insertError } = await supabase
      .from('payments')
      .insert({
        member_id,
        membership_id: membership_id || null,
        amount,
        currency: currency || 'USD',
        discount: discount !== undefined ? discount : 0,
        tax: tax !== undefined ? tax : 0,
        payment_method,
        payment_status,
        notes: notes || null,
        receipt_url: receipt_url || null,
        invoice_number: invoiceNumber,
        payment_date: paymentDate
      })
      .select('*, member:members(*), membership:memberships(*)')
      .single();

    if (insertError) {
      throw new Error(`Database error: ${insertError.message}`);
    }

    let finalPayment = newPayment;
    if (newPayment.payment_status === 'completed' && !newPayment.receipt_url) {
      try {
        const path = await invoiceService.generateInvoice(newPayment, newPayment.member, newPayment.membership);
        const { data: updated } = await supabase
          .from('payments')
          .update({ receipt_url: path })
          .eq('id', newPayment.id)
          .select('*, member:members(*), membership:memberships(*)')
          .single();
        if (updated) finalPayment = updated;
      } catch (err) {
        console.error('Invoice generation failed:', err);
      }
    }

    return {
      ...finalPayment,
      final_amount: this.getFinalAmount(finalPayment)
    };
  }

  async updatePayment(id, data) {
    // 1. Verify payment exists
    const current = await this.getPaymentById(id);

    // 2. Verify member if changing
    if (data.member_id !== undefined && data.member_id !== current.member_id) {
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('id', data.member_id)
        .maybeSingle();

      if (memberError) {
        throw new Error(`Database error: ${memberError.message}`);
      }
      if (!member) {
        throw new Error('Member not found.');
      }
    }

    // 3. Verify membership if changing
    if (data.membership_id !== undefined && data.membership_id !== current.membership_id) {
      if (data.membership_id) {
        const { data: membership, error: membershipError } = await supabase
          .from('memberships')
          .select('id')
          .eq('id', data.membership_id)
          .maybeSingle();

        if (membershipError) {
          throw new Error(`Database error: ${membershipError.message}`);
        }
        if (!membership) {
          throw new Error('Membership not found.');
        }
      }
    }

    // 4. Perform update
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    };

    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', id)
      .select('*, member:members(*), membership:memberships(*)')
      .single();

    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`);
    }

    let finalPayment = updatedPayment;
    if (updatedPayment.payment_status === 'completed' && !updatedPayment.receipt_url) {
      try {
        const path = await invoiceService.generateInvoice(updatedPayment, updatedPayment.member, updatedPayment.membership);
        const { data: updated } = await supabase
          .from('payments')
          .update({ receipt_url: path })
          .eq('id', updatedPayment.id)
          .select('*, member:members(*), membership:memberships(*)')
          .single();
        if (updated) finalPayment = updated;
      } catch (err) {
        console.error('Invoice generation failed:', err);
      }
    }

    return {
      ...finalPayment,
      final_amount: this.getFinalAmount(finalPayment)
    };
  }

  async deletePayment(id) {
    // Verify payment exists
    await this.getPaymentById(id);

    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return true;
  }

  async updatePaymentStatus(id, status) {
    // Verify payment exists
    await this.getPaymentById(id);

    const { data: updatedPayment, error } = await supabase
      .from('payments')
      .update({
        payment_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, member:members(*), membership:memberships(*)')
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    let finalPayment = updatedPayment;
    if (updatedPayment.payment_status === 'completed' && !updatedPayment.receipt_url) {
      try {
        const path = await invoiceService.generateInvoice(updatedPayment, updatedPayment.member, updatedPayment.membership);
        const { data: updated } = await supabase
          .from('payments')
          .update({ receipt_url: path })
          .eq('id', updatedPayment.id)
          .select('*, member:members(*), membership:memberships(*)')
          .single();
        if (updated) finalPayment = updated;
      } catch (err) {
        console.error('Invoice generation failed:', err);
      }
    }

    return {
      ...finalPayment,
      final_amount: this.getFinalAmount(finalPayment)
    };
  }
}

module.exports = new PaymentService();
