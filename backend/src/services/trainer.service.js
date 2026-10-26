const supabase = require('../config/supabase');

class TrainerService {
  async getAllTrainers({ page = 1, limit = 10, search, status, specialization, sortBy = 'newest' }) {
    const fromIndex = (parseInt(page) - 1) * parseInt(limit);
    const toIndex = fromIndex + parseInt(limit) - 1;

    let query = supabase
      .from('trainers')
      .select('*', { count: 'exact' });

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply specialization filter
    if (specialization) {
      query = query.eq('specialization', specialization);
    }

    // Apply search filter (first_name, last_name, or email)
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply sorting
    if (sortBy === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination range
    query = query.range(fromIndex, toIndex);

    const { data, count, error } = await query;
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      trainers: data || [],
      pagination: {
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: count ? Math.ceil(count / parseInt(limit)) : 0
      }
    };
  }

  async getTrainerById(id) {
    const { data: trainer, error } = await supabase
      .from('trainers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!trainer) {
      throw new Error('Trainer not found.');
    }

    return trainer;
  }

  async createTrainer(data) {
    const { email } = data;

    // Check if email already in use
    const { data: existingTrainer, error: checkError } = await supabase
      .from('trainers')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Database error: ${checkError.message}`);
    }
    if (existingTrainer) {
      throw new Error('Email address is already in use by another trainer.');
    }

    const { data: newTrainer, error } = await supabase
      .from('trainers')
      .insert({
        ...data,
        status: data.status || 'active'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return newTrainer;
  }

  async updateTrainer(id, data) {
    // Check if trainer exists first
    await this.getTrainerById(id);

    const { email } = data;

    if (email) {
      // Check if email is in use by another trainer
      const { data: existingTrainer, error: checkError } = await supabase
        .from('trainers')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .maybeSingle();

      if (checkError) {
        throw new Error(`Database error: ${checkError.message}`);
      }
      if (existingTrainer) {
        throw new Error('Email address is already in use by another trainer.');
      }
    }

    const { data: updatedTrainer, error } = await supabase
      .from('trainers')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return updatedTrainer;
  }

  async deleteTrainer(id) {
    // Check if trainer exists first
    await this.getTrainerById(id);

    const { error } = await supabase
      .from('trainers')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return true;
  }

  async updateTrainerStatus(id, status) {
    // Check if trainer exists first
    await this.getTrainerById(id);

    const { data: updatedTrainer, error } = await supabase
      .from('trainers')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return updatedTrainer;
  }
}

module.exports = new TrainerService();
