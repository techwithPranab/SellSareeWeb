/**
 * Seeds only the five default PP's Aura homepage carousel slides.
 * Existing slides with matching imagePublicId values are updated; other
 * admin-created carousel slides and database collections are left untouched.
 *
 * Run: npm run seed:carousel
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Banner from './models/Banner';
import { CAROUSEL_SLIDES } from './data/carouselSlides';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sareeselling';

async function seedCarousel() {
  console.log('\n🖼️  Seeding PP’s Aura homepage carousel...');

  try {
    await mongoose.connect(MONGO_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
    });

    const result = await Banner.bulkWrite(
      CAROUSEL_SLIDES.map((slide) => ({
        updateOne: {
          filter: { imagePublicId: slide.imagePublicId },
          update: { $set: slide },
          upsert: true,
        },
      }))
    );

    console.log(`✅ Carousel ready: ${CAROUSEL_SLIDES.length} slides`);
    console.log(`   Created: ${result.upsertedCount}`);
    console.log(`   Updated: ${result.modifiedCount}`);
  } catch (error) {
    console.error('❌ Carousel seed failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

void seedCarousel();
