const memberService = require('../src/services/member.service');

async function run() {
  try {
    console.log('--- 1. Testing Create Member ---');
    const newMember = await memberService.createMember({
      first_name: 'John',
      last_name: 'Doe',
      email: `johndoe-${Date.now()}@test.com`,
      phone: '12345678',
      gender: 'male',
      status: 'active'
    });
    console.log('CREATE SUCCESS:', newMember.id);

    console.log('--- 2. Testing Get Member ---');
    const fetched = await memberService.getMemberById(newMember.id);
    console.log('FETCHED SUCCESS:', fetched.first_name, fetched.last_name);

    console.log('--- 3. Testing Update Member ---');
    const updated = await memberService.updateMember(newMember.id, {
      first_name: 'Johnny'
    });
    console.log('UPDATE SUCCESS:', updated.first_name);

    console.log('--- 4. Testing Get All Members ---');
    const all = await memberService.getAllMembers({ page: 1, limit: 10, search: 'Johnny' });
    console.log('GET ALL SUCCESS:', all.members.length, 'records found.');

    console.log('--- 5. Testing Delete Member ---');
    await memberService.deleteMember(newMember.id);
    console.log('DELETE SUCCESS');

  } catch (error) {
    console.error('CRUD TRIAL FAILED:', error.message);
  }
}

run();
