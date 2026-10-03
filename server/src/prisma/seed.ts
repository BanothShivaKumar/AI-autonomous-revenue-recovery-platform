import { seedDemoBusiness } from '../services/demo/demoSeeder';

async function main() {
  console.log('Seeding PayPilot demo environment...');
  await seedDemoBusiness();
  console.log('Finished seeding.');
  process.exit(0);
}

main().catch((e) => {
  console.error('Error during seeding:', e);
  process.exit(1);
});
