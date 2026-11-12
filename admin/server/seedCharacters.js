const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const fs = require('fs');
const path = require('path');
const AnimeCategory = require('./models/AnimeCategory');
const AnimeCharacter = require('./models/AnimeCharacter');

async function seedDefaultCharacters(userId = null) {
  try {
    let narutoCat = await AnimeCategory.findOne({ slug: 'naruto' });
    if (!narutoCat) {
      narutoCat = await AnimeCategory.create({
        name: 'Naruto Shippuden',
        slug: 'naruto',
        color: '#F97316',
        description: 'The iconic ninja world of Naruto Shippuden',
        createdBy: userId
      });
      console.log('[Seed] Created Anime Category: Naruto Shippuden');
    }

    const publicAvatarsDir = path.resolve(__dirname, '../../student/client/public/avatars');
    
    // Read Sakura SVG if available
    const sakuraSvgPath = path.join(publicAvatarsDir, 'sakura.svg');
    const sakuraSvg = fs.existsSync(sakuraSvgPath)
      ? fs.readFileSync(sakuraSvgPath, 'utf8')
      : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" width="100%" height="100%"><image href="/avatars/sakura.png" width="200" height="280" preserveAspectRatio="xMidYMid meet" /></svg>';

    // Read Obito SVG if available
    const obitoSvgPath = path.join(publicAvatarsDir, 'obito.svg');
    const obitoSvg = fs.existsSync(obitoSvgPath)
      ? fs.readFileSync(obitoSvgPath, 'utf8')
      : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" width="100%" height="100%"><image href="/avatars/obito.png" width="200" height="280" preserveAspectRatio="xMidYMid meet" /></svg>';

    function makeEmbeddedSvg(pngName) {
      const filePath = path.join(publicAvatarsDir, pngName);
      if (fs.existsSync(filePath)) {
        const b64 = fs.readFileSync(filePath).toString('base64');
        const dataUri = `data:image/png;base64,${b64}`;
        return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 280" width="100%" height="100%"><image href="${dataUri}" xlink:href="${dataUri}" width="200" height="280" preserveAspectRatio="xMidYMid meet" /></svg>`;
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" width="100%" height="100%"><image href="/avatars/${pngName}" width="200" height="280" preserveAspectRatio="xMidYMid meet" /></svg>`;
    }

    const initialChars = [
      {
        characterId: 'naruto',
        name: 'Naruto Uzumaki',
        animeId: 'naruto',
        animeName: 'Naruto Shippuden',
        gender: 'male',
        color: '#F97316',
        themeGradient: 'from-orange-400/20 to-amber-600/30',
        borderColor: 'border-orange-500/30',
        svg: makeEmbeddedSvg('naruto.png')
      },
      {
        characterId: 'sasuke',
        name: 'Sasuke Uchiha',
        animeId: 'naruto',
        animeName: 'Naruto Shippuden',
        gender: 'male',
        color: '#3B82F6',
        themeGradient: 'from-blue-500/20 to-indigo-700/30',
        borderColor: 'border-indigo-500/30',
        svg: makeEmbeddedSvg('sasuke.png')
      },
      {
        characterId: 'sakura',
        name: 'Sakura Haruno',
        animeId: 'naruto',
        animeName: 'Naruto Shippuden',
        gender: 'female',
        color: '#EC4899',
        themeGradient: 'from-pink-400/20 to-rose-600/30',
        borderColor: 'border-pink-500/30',
        svg: sakuraSvg
      },
      {
        characterId: 'kakashi',
        name: 'Kakashi Hatake',
        animeId: 'naruto',
        animeName: 'Naruto Shippuden',
        gender: 'male',
        color: '#10B981',
        themeGradient: 'from-emerald-500/20 to-slate-900/40',
        borderColor: 'border-emerald-500/30',
        svg: makeEmbeddedSvg('kakashi.png')
      },
      {
        characterId: 'itachi',
        name: 'Itachi Uchiha',
        animeId: 'naruto',
        animeName: 'Naruto Shippuden',
        gender: 'male',
        color: '#EF4444',
        themeGradient: 'from-red-600/20 to-zinc-900/40',
        borderColor: 'border-red-600/40',
        svg: makeEmbeddedSvg('itachi.png')
      },
      {
        characterId: 'obito',
        name: 'Obito Uchiha',
        animeId: 'naruto',
        animeName: 'Naruto Shippuden',
        gender: 'male',
        color: '#F59E0B',
        themeGradient: 'from-amber-500/20 to-orange-700/30',
        borderColor: 'border-amber-500/30',
        svg: obitoSvg
      }
    ];

    let seededCount = 0;
    for (const charData of initialChars) {
      const existing = await AnimeCharacter.findOne({ characterId: charData.characterId });
      if (!existing) {
        await AnimeCharacter.create({
          ...charData,
          categoryId: narutoCat._id,
          createdBy: userId
        });
        seededCount++;
        console.log(`[Seed] Seeded character: ${charData.name}`);
      } else {
        // Upgrade existing character SVG to self-contained embedded SVG
        if (existing.svg.includes('href="/avatars/')) {
          existing.svg = charData.svg;
          await existing.save();
          console.log(`[Seed] Upgraded ${charData.name} SVG to self-contained embedded SVG`);
        }
      }
    }

    return { success: true, seededCount };
  } catch (err) {
    console.error('[Seed] Error seeding characters:', err);
    throw err;
  }
}

// Standalone execution
if (require.main === module) {
  const mongoose = require('mongoose');
  const path = require('path');
  require('dotenv').config();
  if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.resolve(__dirname, '../../.env.shared'), override: true });
  }
  const uri = process.env.MONGODB_URI;
  
  mongoose.connect(uri, { dbName: 'zync' })
    .then(async () => {
      console.log('Connected to MongoDB for seeding');
      const res = await seedDefaultCharacters();
      console.log('Seeding completed:', res);
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seedDefaultCharacters };
