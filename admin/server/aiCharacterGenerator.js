/**
 * ZYNC AI Character Generator Engine
 * Powered by Google Gemini AI & Canonical Vector Character Library
 * 
 * Generates 100% authentic, canonical, full-body vector SVG character designs
 * in 200x280 coordinate space for student avatars.
 */

const Setting = require('./models/Setting');

// Canonical Master Prompt Template
function buildCharacterPrompt(animeName, characterName, formVariation) {
  const cleanId = (characterName || 'character').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const formText = formVariation && formVariation.trim() ? formVariation.trim() : 'DEFAULT / CLASSIC ICONIC FORM';

  return `You are a master vector character artist and senior frontend SVG engineer.

I need a 100% authentic, canonical, full-body vector SVG character design for:
- Anime Universe: ${animeName}
- Character Name: ${characterName}
- Form / Variation: ${formText}

CRITICAL PROPORTION & ANATOMY RULES (DO NOT USE A GENERIC MANNEQUIN):
1. ANATOMY & SILHOUETTE ACCURACY:
   - Do NOT use standard humanoid proportions if the character has unique proportions!
   - Capture the true canonical silhouette and head-to-body ratio of this specific character (e.g., squat 2-head chibi toddler for Shinchan with his signature potato-shaped head and chubby cheeks; round spherical 2-head ratio with no neck and stubby legs for Doraemon; pear-shaped electric rodent body for Pikachu; muscular anime hero 6-head athletic anatomy for Goku; etc.).
   - Include all iconic anatomical quirks: exact eye style, nose shape (or lack thereof), mouth, ears, brows, hairstyle, and body posture.

2. OFFICIAL COLOR PALETTE:
   - Use the exact official hexadecimal color codes for skin, hair, clothes, pupils, highlights, and signature accessories.
   - Use proper flat vector cel-shading (base color, shadow tones, highlight tints) to give high-end modern cinematic depth.

3. CODE FORMAT & VIEWPORT:
   - Output ONLY valid, clean SVG / React JSX vector code wrapped inside a single <g id="${cleanId}"> tag.
   - Target ViewBox coordinate space: 0 0 200 280 (Center X = 100, Base ground Y ≈ 255).
   - Use native SVG elements only: <path>, <polygon>, <circle>, <ellipse>, <rect>.
   - Ensure the character stands centered, facing forward, in an iconic idle stance.
   - Do NOT include any background rectangle or wrapper <svg> tag—just the inner <g> group containing the complete layered character (Shadow -> Base Body / Limbs -> Outfit -> Face / Head -> Accessories -> Highlights).

Generate the complete, ready-to-use vector code for ${characterName} now.
OUTPUT ONLY THE VECTOR CODE. Do not include markdown code blocks, explanations, or notes.`;
}

// -------------------------------------------------------------
// CANONICAL VECTOR PRESET LIBRARY (FOR OFFLINE / ZERO-CONFIG USE)
// -------------------------------------------------------------
const CANONICAL_PRESETS = {
  shinchan: {
    name: 'Shinnosuke Nohara (Shinchan)',
    animeName: 'Crayon Shin-chan',
    animeSlug: 'crayon-shin-chan',
    gender: 'male',
    color: '#E53E3E',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" width="100%" height="100%">
  <g id="shinchan">
    <!-- Ground Shadow -->
    <ellipse cx="100" cy="255" rx="42" ry="7" fill="#000000" opacity="0.4" />
    
    <!-- Toddler Legs & Shoes -->
    <!-- Left Leg -->
    <rect x="83" y="200" width="12" height="36" rx="5" fill="#FED7AA" />
    <!-- Left Sock -->
    <rect x="82" y="228" width="14" height="12" rx="3" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
    <!-- Left Shoe (Cyan) -->
    <ellipse cx="89" cy="246" rx="13" ry="8" fill="#06B6D4" stroke="#0891B2" stroke-width="1.5" />
    <path d="M78 243 Q89 238 100 243" stroke="#FFFFFF" stroke-width="1.5" fill="none" opacity="0.6" />

    <!-- Right Leg -->
    <rect x="105" y="200" width="12" height="36" rx="5" fill="#FED7AA" />
    <!-- Right Sock -->
    <rect x="104" y="228" width="14" height="12" rx="3" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1" />
    <!-- Right Shoe (Cyan) -->
    <ellipse cx="111" cy="246" rx="13" ry="8" fill="#06B6D4" stroke="#0891B2" stroke-width="1.5" />
    <path d="M100 243 Q111 238 122 243" stroke="#FFFFFF" stroke-width="1.5" fill="none" opacity="0.6" />

    <!-- Yellow Shorts -->
    <path d="M74 168 L126 168 L128 206 L103 206 L100 196 L97 206 L72 206 Z" fill="#FACC15" stroke="#CA8A04" stroke-width="2" />
    <!-- Shorts Crotch Crease -->
    <path d="M100 178 L100 196" stroke="#CA8A04" stroke-width="2" />

    <!-- Chubby Arms -->
    <!-- Left Arm -->
    <path d="M68 132 Q50 150 56 168 Q62 174 68 166 Q74 150 78 136 Z" fill="#FED7AA" stroke="#1E293B" stroke-width="1.5" />
    <!-- Right Arm -->
    <path d="M132 132 Q150 150 144 168 Q138 174 132 166 Q126 150 122 136 Z" fill="#FED7AA" stroke="#1E293B" stroke-width="1.5" />

    <!-- Red Iconic Shirt -->
    <path d="M66 128 Q100 122 134 128 L136 172 Q100 176 64 172 Z" fill="#EF4444" stroke="#B91C1C" stroke-width="2" />
    <!-- Collar Line -->
    <path d="M86 126 Q100 135 114 126" fill="none" stroke="#B91C1C" stroke-width="2.5" />
    <!-- Sleeve Seams -->
    <path d="M74 127 L70 146" stroke="#B91C1C" stroke-width="1.5" />
    <path d="M126 127 L130 146" stroke="#B91C1C" stroke-width="1.5" />

    <!-- Head: Potato / Squishy Chibi Silhouette -->
    <!-- Base Head Contour -->
    <path d="M62 76 C55 92 56 108 68 118 C78 126 95 128 114 126 C136 124 148 112 148 94 C148 76 138 60 120 54 C98 48 72 58 62 76 Z" fill="#FED7AA" stroke="#1E293B" stroke-width="2.5" />
    
    <!-- Signature Chubby Right Cheek Bulge -->
    <path d="M132 88 C152 94 154 114 138 122" fill="#FED7AA" stroke="#1E293B" stroke-width="2.5" />

    <!-- Hair: Iconic Black Short Crop on Top & Left -->
    <path d="M64 74 C60 56 78 44 100 44 C120 44 136 52 140 68 C130 62 116 58 100 58 C82 58 70 64 64 74 Z" fill="#18181B" />
    
    <!-- Left Ear -->
    <ellipse cx="58" cy="94" rx="8" ry="11" fill="#FED7AA" stroke="#1E293B" stroke-width="2" />
    <path d="M56 90 Q60 94 56 98" fill="none" stroke="#1E293B" stroke-width="1.5" />

    <!-- Massive Iconic Comedic Eyebrows -->
    <!-- Left Brow -->
    <path d="M72 70 Q84 62 94 69 Q84 76 72 70 Z" fill="#18181B" stroke="#18181B" stroke-width="1.5" />
    <!-- Right Brow -->
    <path d="M106 69 Q118 61 130 68 Q118 75 106 69 Z" fill="#18181B" stroke="#18181B" stroke-width="1.5" />

    <!-- Oval Cartoon Eyes -->
    <!-- Left Eye White -->
    <ellipse cx="84" cy="84" rx="9" ry="12" fill="#FFFFFF" stroke="#1E293B" stroke-width="2" />
    <!-- Left Pupil -->
    <ellipse cx="86" cy="85" rx="5" ry="7" fill="#18181B" />
    <circle cx="84" cy="82" r="2" fill="#FFFFFF" />

    <!-- Right Eye White -->
    <ellipse cx="116" cy="83" rx="9" ry="12" fill="#FFFFFF" stroke="#1E293B" stroke-width="2" />
    <!-- Right Pupil -->
    <ellipse cx="118" cy="84" rx="5" ry="7" fill="#18181B" />
    <circle cx="116" cy="81" r="2" fill="#FFFFFF" />

    <!-- Cute Cheerful Open Mouth -->
    <path d="M92 104 Q102 118 114 105 Q103 108 92 104 Z" fill="#BE123C" stroke="#1E293B" stroke-width="2" />
    <!-- Tongue Tint -->
    <path d="M96 109 Q103 105 110 109 Q103 115 96 109 Z" fill="#F43F5E" />

    <!-- Soft Cheek Blush -->
    <ellipse cx="70" cy="98" rx="6" ry="3" fill="#FB7185" opacity="0.4" />
    <ellipse cx="134" cy="98" rx="7" ry="4" fill="#FB7185" opacity="0.4" />
  </g>
</svg>`
  },

  doraemon: {
    name: 'Doraemon',
    animeName: 'Doraemon',
    animeSlug: 'doraemon',
    gender: 'other',
    color: '#0284C7',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" width="100%" height="100%">
  <g id="doraemon">
    <!-- Ground Shadow -->
    <ellipse cx="100" cy="254" rx="50" ry="8" fill="#000000" opacity="0.4" />

    <!-- Feet (White Oval Paws) -->
    <ellipse cx="80" cy="246" rx="20" ry="12" fill="#FFFFFF" stroke="#0F172A" stroke-width="2.5" />
    <ellipse cx="120" cy="246" rx="20" ry="12" fill="#FFFFFF" stroke="#0F172A" stroke-width="2.5" />

    <!-- Blue Chubby Body -->
    <path d="M62 145 C50 180 52 230 76 242 C88 246 112 246 124 242 C148 230 150 180 138 145 Z" fill="#0284C7" stroke="#0F172A" stroke-width="2.5" />

    <!-- White Belly Oval -->
    <ellipse cx="100" cy="192" rx="34" ry="36" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" />
    
    <!-- 4D Pocket (Half-Moon Semicircle) -->
    <path d="M76 188 Q100 188 124 188 C124 212 76 212 76 188 Z" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" />

    <!-- White Ball Hands -->
    <!-- Left Hand -->
    <circle cx="48" cy="174" r="14" fill="#FFFFFF" stroke="#0F172A" stroke-width="2.5" />
    <path d="M64 150 L56 168" stroke="#0F172A" stroke-width="2.5" />
    <!-- Right Hand -->
    <circle cx="152" cy="174" r="14" fill="#FFFFFF" stroke="#0F172A" stroke-width="2.5" />
    <path d="M136 150 L144 168" stroke="#0F172A" stroke-width="2.5" />

    <!-- Red Collar -->
    <rect x="66" y="138" width="68" height="10" rx="5" fill="#EF4444" stroke="#0F172A" stroke-width="2" />

    <!-- Golden Bell -->
    <circle cx="100" cy="154" r="9" fill="#FACC15" stroke="#0F172A" stroke-width="1.8" />
    <circle cx="100" cy="155" r="2.5" fill="#713F12" />
    <line x1="100" y1="157" x2="100" y2="163" stroke="#713F12" stroke-width="1.5" />
    <line x1="93" y1="152" x2="107" y2="152" stroke="#713F12" stroke-width="1.2" />

    <!-- Head: Large Spherical Blue Base -->
    <circle cx="100" cy="85" r="54" fill="#0284C7" stroke="#0F172A" stroke-width="2.5" />

    <!-- White Face Mask Semicircle -->
    <ellipse cx="100" cy="94" rx="44" ry="40" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" />

    <!-- Big Connected Cartoon Eyes -->
    <!-- Left Eye White -->
    <ellipse cx="91" cy="56" rx="10" ry="15" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" />
    <circle cx="94" cy="58" r="3.5" fill="#0F172A" />
    <circle cx="93" cy="56" r="1.2" fill="#FFFFFF" />

    <!-- Right Eye White -->
    <ellipse cx="109" cy="56" rx="10" ry="15" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" />
    <circle cx="106" cy="58" r="3.5" fill="#0F172A" />
    <circle cx="105" cy="56" r="1.2" fill="#FFFFFF" />

    <!-- Bright Red Nose -->
    <circle cx="100" cy="72" r="7" fill="#EF4444" stroke="#0F172A" stroke-width="1.8" />
    <circle cx="98" cy="70" r="2" fill="#FFFFFF" />

    <!-- Nose to Mouth Bridge Line -->
    <line x1="100" y1="79" x2="100" y2="114" stroke="#0F172A" stroke-width="2" />

    <!-- Wide Happy Cat Smile -->
    <path d="M68 96 Q100 132 132 96" fill="none" stroke="#0F172A" stroke-width="2.5" />

    <!-- Whisker Sets (3 Left, 3 Right) -->
    <!-- Left Whiskers -->
    <line x1="62" y1="84" x2="90" y2="88" stroke="#0F172A" stroke-width="1.5" />
    <line x1="60" y1="94" x2="90" y2="94" stroke="#0F172A" stroke-width="1.5" />
    <line x1="62" y1="104" x2="90" y2="100" stroke="#0F172A" stroke-width="1.5" />
    <!-- Right Whiskers -->
    <line x1="110" y1="88" x2="138" y2="84" stroke="#0F172A" stroke-width="1.5" />
    <line x1="110" y1="94" x2="140" y2="94" stroke="#0F172A" stroke-width="1.5" />
    <line x1="110" y1="100" x2="138" y2="104" stroke="#0F172A" stroke-width="1.5" />
  </g>
</svg>`
  },

  pikachu: {
    name: 'Pikachu',
    animeName: 'Pokémon',
    animeSlug: 'pokemon',
    gender: 'male',
    color: '#FACC15',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" width="100%" height="100%">
  <g id="pikachu">
    <!-- Ground Shadow -->
    <ellipse cx="100" cy="255" rx="46" ry="7" fill="#000000" opacity="0.4" />

    <!-- Lightning Bolt Tail (Background layer) -->
    <path d="M118 200 L146 170 L136 154 L170 120 L156 108 L188 72 L164 122 L176 136 L146 168 L154 182 Z" fill="#FACC15" stroke="#CA8A04" stroke-width="2" />
    <path d="M118 200 L134 184 L142 192 L126 208 Z" fill="#854D0E" />

    <!-- Cute Chubby Feet -->
    <ellipse cx="78" cy="248" rx="14" ry="7" fill="#FACC15" stroke="#CA8A04" stroke-width="2" />
    <ellipse cx="122" cy="248" rx="14" ry="7" fill="#FACC15" stroke="#CA8A04" stroke-width="2" />

    <!-- Pear-Shaped Chubby Body -->
    <path d="M68 136 C52 170 54 228 74 246 C86 250 114 250 126 246 C146 228 148 170 132 136 Z" fill="#FACC15" stroke="#CA8A04" stroke-width="2.5" />

    <!-- Brown Back Stripes -->
    <path d="M60 178 Q74 182 86 180" stroke="#854D0E" stroke-width="4.5" stroke-linecap="round" fill="none" />
    <path d="M62 196 Q76 200 88 198" stroke="#854D0E" stroke-width="4.5" stroke-linecap="round" fill="none" />

    <!-- Small Forepaws Resting on Chest -->
    <ellipse cx="86" cy="182" rx="7" ry="10" fill="#FACC15" stroke="#CA8A04" stroke-width="1.8" transform="rotate(-15 86 182)" />
    <ellipse cx="114" cy="182" rx="7" ry="10" fill="#FACC15" stroke="#CA8A04" stroke-width="1.8" transform="rotate(15 114 182)" />

    <!-- Long Pointed Ears -->
    <!-- Left Ear -->
    <path d="M72 82 Q42 42 34 22 Q44 20 62 46 Q76 68 80 84 Z" fill="#FACC15" stroke="#CA8A04" stroke-width="2" />
    <!-- Left Ear Black Tip -->
    <path d="M34 22 Q44 20 54 36 L40 44 Z" fill="#18181B" />

    <!-- Right Ear -->
    <path d="M128 84 Q142 68 156 46 Q174 20 184 22 Q176 42 146 82 Z" fill="#FACC15" stroke="#CA8A04" stroke-width="2" />
    <!-- Right Ear Black Tip -->
    <path d="M184 22 Q174 20 164 36 L178 44 Z" fill="#18181B" />

    <!-- Head: Round Chubby Head -->
    <circle cx="100" cy="110" r="44" fill="#FACC15" stroke="#CA8A04" stroke-width="2.5" />

    <!-- Sparkling Black Eyes with White Highlights -->
    <circle cx="78" cy="104" r="7.5" fill="#18181B" />
    <circle cx="76" cy="101" r="2.5" fill="#FFFFFF" />

    <circle cx="122" cy="104" r="7.5" fill="#18181B" />
    <circle cx="120" cy="101" r="2.5" fill="#FFFFFF" />

    <!-- Iconic Bright Red Electric Cheek Pouches -->
    <circle cx="66" cy="122" r="10.5" fill="#EF4444" />
    <circle cx="134" cy="122" r="10.5" fill="#EF4444" />

    <!-- Tiny Cute Nose Dot -->
    <polygon points="100,108 98,111 102,111" fill="#18181B" />

    <!-- Sweet ':3' W-Shaped Smile -->
    <path d="M92 116 Q96 122 100 117 Q104 122 108 116" fill="none" stroke="#18181B" stroke-width="2" stroke-linecap="round" />
  </g>
</svg>`
  },

  goku: {
    name: 'Son Goku',
    animeName: 'Dragon Ball Z',
    animeSlug: 'dragon-ball-z',
    gender: 'male',
    color: '#F97316',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" width="100%" height="100%">
  <g id="goku">
    <!-- Ground Shadow -->
    <ellipse cx="100" cy="255" rx="44" ry="7" fill="#000000" opacity="0.4" />

    <!-- Martial Arts Boots (Navy with Red Ribbon) -->
    <!-- Left Boot -->
    <path d="M78 226 L74 246 C74 252 86 252 90 248 L90 226 Z" fill="#1E3A8A" stroke="#172554" stroke-width="2" />
    <line x1="84" y1="226" x2="84" y2="248" stroke="#EF4444" stroke-width="2" />
    <!-- Right Boot -->
    <path d="M110 226 L110 248 C114 252 126 252 126 246 L122 226 Z" fill="#1E3A8A" stroke="#172554" stroke-width="2" />
    <line x1="116" y1="226" x2="116" y2="248" stroke="#EF4444" stroke-width="2" />

    <!-- Orange Gi Pants -->
    <path d="M68 160 L132 160 L130 228 L110 228 L100 176 L90 228 L70 228 Z" fill="#EA580C" stroke="#C2410C" stroke-width="2" />
    <!-- Pant Folds -->
    <path d="M80 180 Q84 200 78 220" stroke="#C2410C" stroke-width="1.8" fill="none" />
    <path d="M120 180 Q116 200 122 220" stroke="#C2410C" stroke-width="1.8" fill="none" />

    <!-- Navy Blue Sash / Obi Belt -->
    <rect x="74" y="152" width="52" height="12" rx="3" fill="#1E3A8A" stroke="#172554" stroke-width="1.5" />
    <path d="M114 162 L120 192 L112 192 L108 164 Z" fill="#1E3A8A" />

    <!-- Muscular Arms with Navy Wristbands -->
    <!-- Left Arm -->
    <path d="M66 114 Q52 134 56 160 L68 158 Q64 136 76 122 Z" fill="#FED7AA" stroke="#1E293B" stroke-width="1.8" />
    <rect x="52" y="146" width="16" height="14" rx="3" fill="#1E3A8A" stroke="#172554" stroke-width="1.5" />
    <!-- Right Arm -->
    <path d="M134 114 Q148 134 144 160 L132 158 Q136 136 124 122 Z" fill="#FED7AA" stroke="#1E293B" stroke-width="1.8" />
    <rect x="132" y="146" width="16" height="14" rx="3" fill="#1E3A8A" stroke="#172554" stroke-width="1.5" />

    <!-- Orange Gi Torso with V-Neck Undershirt -->
    <path d="M68 114 L132 114 L126 154 L74 154 Z" fill="#EA580C" stroke="#C2410C" stroke-width="2" />
    <!-- Navy Blue V-Neck Undershirt -->
    <polygon points="84,114 116,114 100,138" fill="#1E3A8A" />
    <!-- Muscular Neck & Chest Peak -->
    <polygon points="90,114 110,114 100,126" fill="#FED7AA" />

    <!-- Head & Neck -->
    <rect x="91" y="96" width="18" height="20" fill="#FED7AA" stroke="#1E293B" stroke-width="1.5" />
    <!-- Chiseled Chin & Jaw -->
    <polygon points="76,82 124,82 116,104 100,112 84,104" fill="#FED7AA" stroke="#1E293B" stroke-width="2" />

    <!-- Ears -->
    <ellipse cx="74" cy="88" rx="5" ry="9" fill="#FED7AA" stroke="#1E293B" stroke-width="1.5" />
    <ellipse cx="126" cy="88" rx="5" ry="9" fill="#FED7AA" stroke="#1E293B" stroke-width="1.5" />

    <!-- Iconic Spiky Super Saiyan / Goku Black Hair Peaks -->
    <!-- Large Spikes Sweeping Outward -->
    <path d="M64 80 L38 66 L60 62 L32 40 L64 42 L52 18 L82 32 L100 12 L118 32 L148 18 L136 42 L168 40 L140 62 L162 66 L136 80 Z" fill="#18181B" stroke="#09090B" stroke-width="2.5" />
    <!-- Forehead Bangs -->
    <path d="M80 72 L86 86 L94 74 L102 88 L110 74 L118 84 L122 72 Z" fill="#18181B" />

    <!-- Determined Martial Artist Eyes & Eyebrows -->
    <!-- Eyebrows -->
    <path d="M80 82 L96 86 L96 82 L80 78 Z" fill="#18181B" />
    <path d="M120 82 L104 86 L104 82 L120 78 Z" fill="#18181B" />

    <!-- Eyes (Intense Angular Anime Eyes) -->
    <polygon points="82,85 94,88 92,92 84,91" fill="#FFFFFF" stroke="#18181B" stroke-width="1.2" />
    <circle cx="89" cy="88" r="2.2" fill="#18181B" />

    <polygon points="118,85 106,88 108,92 116,91" fill="#FFFFFF" stroke="#18181B" stroke-width="1.2" />
    <circle cx="111" cy="88" r="2.2" fill="#18181B" />

    <!-- Chiseled Nose -->
    <path d="M98 94 L101 98 L98 98" stroke="#18181B" stroke-width="1.5" fill="none" />

    <!-- Confident Smirk -->
    <path d="M92 103 Q100 106 108 102" stroke="#18181B" stroke-width="2" stroke-linecap="round" fill="none" />
  </g>
</svg>`
  },

  luffy: {
    name: 'Monkey D. Luffy',
    animeName: 'One Piece',
    animeSlug: 'one-piece',
    gender: 'male',
    color: '#EF4444',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" width="100%" height="100%">
  <g id="luffy">
    <!-- Ground Shadow -->
    <ellipse cx="100" cy="255" rx="42" ry="7" fill="#000000" opacity="0.4" />

    <!-- Straw Sandals & Bare Legs -->
    <rect x="80" y="210" width="12" height="34" rx="4" fill="#FED7AA" />
    <ellipse cx="86" cy="248" rx="10" ry="5" fill="#EAB308" stroke="#A16207" stroke-width="1.5" />

    <rect x="108" y="210" width="12" height="34" rx="4" fill="#FED7AA" />
    <ellipse cx="114" cy="248" rx="10" ry="5" fill="#EAB308" stroke="#A16207" stroke-width="1.5" />

    <!-- Blue Rolled-Up Denim Shorts with White Cuffs -->
    <path d="M72 168 L128 168 L126 210 L106 210 L100 194 L94 210 L74 210 Z" fill="#2563EB" stroke="#1D4ED8" stroke-width="2" />
    <!-- White Cuffs -->
    <rect x="73" y="206" width="22" height="6" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1" />
    <rect x="105" y="206" width="22" height="6" rx="2" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1" />

    <!-- Yellow Sash Waist Belt -->
    <rect x="70" y="162" width="60" height="9" rx="3" fill="#EAB308" stroke="#A16207" stroke-width="1.5" />

    <!-- Skinny Athletic Arms -->
    <path d="M68 126 Q54 146 60 172 Q66 174 70 166 Q66 148 76 134 Z" fill="#FED7AA" stroke="#1E293B" stroke-width="1.5" />
    <path d="M132 126 Q146 146 140 172 Q134 174 130 166 Q134 148 124 134 Z" fill="#FED7AA" stroke="#1E293B" stroke-width="1.5" />

    <!-- Red Open Sleeveless Vest -->
    <path d="M68 122 L132 122 L128 164 L72 164 Z" fill="#DC2626" stroke="#991B1B" stroke-width="2" />
    <!-- Bare Chest Opening -->
    <polygon points="86,122 114,122 100,164" fill="#FED7AA" stroke="#1E293B" stroke-width="1.5" />

    <!-- Head & Neck -->
    <rect x="92" y="96" width="16" height="18" fill="#FED7AA" />
    <circle cx="100" cy="88" r="26" fill="#FED7AA" stroke="#1E293B" stroke-width="2" />

    <!-- Shaggy Messy Black Anime Hair -->
    <path d="M72 82 C68 64 80 56 100 56 C120 56 132 64 128 82 C122 76 114 74 100 74 C86 74 78 76 72 82 Z" fill="#18181B" />
    <!-- Hair Spikes Framing Face -->
    <polygon points="74,80 80,94 86,82" fill="#18181B" />
    <polygon points="126,80 120,94 114,82" fill="#18181B" />

    <!-- Iconic Straw Hat (Mugiwara) -->
    <!-- Hat Brim -->
    <ellipse cx="100" cy="56" rx="58" ry="14" fill="#FACC15" stroke="#CA8A04" stroke-width="2.5" />
    <!-- Hat Crown -->
    <path d="M72 54 C72 26 128 26 128 54 Z" fill="#FACC15" stroke="#CA8A04" stroke-width="2.5" />
    <!-- Red Hat Ribbon -->
    <rect x="73" y="44" width="54" height="10" fill="#EF4444" stroke="#B91C1C" stroke-width="1.5" />

    <!-- Big Round Expressive Eyes -->
    <circle cx="86" cy="86" r="6" fill="#FFFFFF" stroke="#18181B" stroke-width="1.5" />
    <circle cx="87" cy="86" r="2.5" fill="#18181B" />

    <circle cx="114" cy="86" r="6" fill="#FFFFFF" stroke="#18181B" stroke-width="1.5" />
    <circle cx="113" cy="86" r="2.5" fill="#18181B" />

    <!-- Left Eye Stitched Scar -->
    <line x1="82" y1="95" x2="90" y2="95" stroke="#991B1B" stroke-width="1.5" />
    <line x1="84" y1="93" x2="84" y2="97" stroke="#991B1B" stroke-width="1" />
    <line x1="88" y1="93" x2="88" y2="97" stroke="#991B1B" stroke-width="1" />

    <!-- Cute Dot Nose -->
    <circle cx="100" cy="91" r="1.5" fill="#18181B" />

    <!-- Wide Signature Luffy Grin -->
    <path d="M84 98 Q100 114 116 98 Q100 102 84 98 Z" fill="#FFFFFF" stroke="#18181B" stroke-width="2" />
  </g>
</svg>`
  }
};

// -------------------------------------------------------------
// CALL GEMINI GENERATIVE LANGUAGE API
// -------------------------------------------------------------
async function callGeminiApi(prompt, apiKey) {
  // Try available Gemini flash models
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192
          }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || `Gemini API error (${res.status})`);
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text || !text.trim()) {
        throw new Error('Gemini returned an empty response');
      }

      return text;
    } catch (err) {
      lastError = err;
      // If error is about invalid key or quota, don't keep polling other models
      if (err.message && (err.message.includes('API key') || err.message.includes('quota') || err.message.includes('expired'))) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Failed to reach Gemini API');
}

// -------------------------------------------------------------
// EXTRACT & FORMAT VALID SVG
// -------------------------------------------------------------
function sanitizeAndWrapSvg(rawText, characterId) {
  if (!rawText) return '';

  // 1. Strip markdown code fences (```xml, ```svg, ```jsx, ```html, ```)
  let clean = rawText
    .replace(/^```(?:xml|svg|jsx|html)?\s*/gim, '')
    .replace(/```\s*$/gim, '')
    .trim();

  // 2. If it contains an <svg> tag, make sure it has proper viewBox
  if (clean.includes('<svg')) {
    // Extract everything from first <svg to last </svg>
    const match = clean.match(/<svg[\s\S]*<\/svg>/i);
    if (match) {
      clean = match[0];
    }
    if (!clean.includes('viewBox')) {
      clean = clean.replace('<svg', '<svg viewBox="0 0 200 280" width="100%" height="100%"');
    }
    return clean;
  }

  // 3. If it contains a <g tag, extract from first <g to last </g>
  if (clean.includes('<g')) {
    const match = clean.match(/<g[\s\S]*<\/g>/i);
    if (match) {
      clean = match[0];
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" width="100%" height="100%">${clean}</svg>`;
  }

  // 4. Fallback wrap
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" width="100%" height="100%"><g id="${characterId}">${clean}</g></svg>`;
}

// -------------------------------------------------------------
// RESOLVE GEMINI API KEY
// -------------------------------------------------------------
async function getEffectiveApiKey(userProvidedKey = null) {
  if (userProvidedKey && userProvidedKey.trim()) {
    return userProvidedKey.trim();
  }
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    return process.env.GEMINI_API_KEY.trim();
  }
  try {
    const setting = await Setting.findOne({ key: 'gemini_api_key' });
    if (setting && setting.value && typeof setting.value === 'string' && setting.value.trim()) {
      return setting.value.trim();
    }
  } catch (e) {}
  return null;
}

// -------------------------------------------------------------
// MAIN GENERATE FUNCTION
// -------------------------------------------------------------
async function generateCharacterVector({
  animeName,
  characterName,
  formVariation = '',
  gender = 'male',
  color = '#F97316',
  apiKey = null
}) {
  if (!animeName || !animeName.trim()) {
    throw new Error('Anime Universe / Verse name is required');
  }
  if (!characterName || !characterName.trim()) {
    throw new Error('Character name is required');
  }

  const cleanCharName = characterName.trim();
  const cleanAnimeName = animeName.trim();
  const cleanId = cleanCharName.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 20);

  // Check if character matches a built-in canonical preset
  const matchedKey = Object.keys(CANONICAL_PRESETS).find(key => {
    const preset = CANONICAL_PRESETS[key];
    const nameMatch = cleanCharName.toLowerCase().includes(key) || key.includes(cleanId);
    return nameMatch;
  });

  const effectiveKey = await getEffectiveApiKey(apiKey);

  // If Gemini API Key is available, use Gemini AI generation
  if (effectiveKey) {
    const prompt = buildCharacterPrompt(cleanAnimeName, cleanCharName, formVariation);
    const rawOutput = await callGeminiApi(prompt, effectiveKey);
    const svg = sanitizeAndWrapSvg(rawOutput, cleanId);

    return {
      success: true,
      svg,
      characterName: cleanCharName,
      animeName: cleanAnimeName,
      formVariation,
      gender,
      color,
      source: 'gemini_ai',
      modelUsed: 'gemini-flash'
    };
  }

  // If no Gemini API key, check if matched to canonical preset
  if (matchedKey) {
    const preset = CANONICAL_PRESETS[matchedKey];
    return {
      success: true,
      svg: preset.svg,
      characterName: preset.name,
      animeName: preset.animeName,
      formVariation: 'Canonical Classic',
      gender: preset.gender,
      color: preset.color,
      source: 'canonical_preset',
      note: 'Rendered from authentic canonical vector preset. Add your Google Gemini API Key to generate any anime character!'
    };
  }

  // If no key and not in preset library, return clear instruction
  throw new Error(
    'Google Gemini API Key is required to generate custom characters with AI. Please enter your API key in the studio modal or get a free key from https://aistudio.google.com/app/apikey.'
  );
}

module.exports = {
  buildCharacterPrompt,
  CANONICAL_PRESETS,
  generateCharacterVector,
  getEffectiveApiKey,
  sanitizeAndWrapSvg
};
