# Guide d'utilisation des couleurs

## ⚠️ Important - Limitation Tailwind

Tailwind CSS nécessite que les classes soient **écrites en dur** dans le code pour que le build puisse les détecter. On ne peut **pas** faire de concaténation dynamique.

## ✅ Approche recommandée

### 1. Pour les styles statiques - Utiliser les constantes

```vue
<script setup>
import { COLOR_CLASSES } from '@/constants/colors'
</script>

<template>
  <!-- Utilisation directe -->
  <div :class="COLOR_CLASSES.card">
    <h2 :class="COLOR_CLASSES.titlePrimary">Mon titre</h2>
  </div>
</template>
```

### 2. Pour les styles conditionnels - Utiliser les constantes

```vue
<script setup>
import { COLOR_CLASSES } from '@/constants/colors'

const isActive = ref(false)
</script>

<template>
  <button :class="isActive ? COLOR_CLASSES.activeTab : COLOR_CLASSES.inactiveTab">
    Mon bouton
  </button>
</template>
```

### 3. Pour des styles mixtes

```vue
<template>
  <!-- Classes fixes + classes conditionnelles -->
  <div :class="['px-4 py-2 rounded', COLOR_CLASSES.card]">
    Contenu
  </div>
</template>
```

## 📝 Classes disponibles dans COLOR_CLASSES

### Textes
- `textPrimary` → text-orange-400
- `textSecondary` → text-slate-300
- `textMuted` → text-slate-400
- `textLight` → text-slate-100
- `textNormal` → text-slate-200

### Backgrounds
- `bgPrimary` → bg-slate-900
- `bgSecondary` → bg-slate-800
- `bgTertiary` → bg-slate-700
- `bgSecondaryOpacity` → bg-slate-800/50
- `bgTertiaryOpacity` → bg-slate-900/50

### Bordures
- `borderPrimary` → border-slate-700
- `borderAccent` → border-orange-500/30
- `borderAccentFull` → border-orange-400
- `borderAccentHover` → hover:border-orange-400

### Onglets
- `activeTab` → Classes complètes pour onglet actif
- `inactiveTab` → Classes complètes pour onglet inactif
- `activeMainTab` → text-slate-100
- `inactiveMainTab` → text-orange-300 hover:text-orange-200

### Inputs
- `input` → Toutes les classes pour un input
- `select` → Toutes les classes pour un select

### Cards
- `card` → Toutes les classes pour une carte

### Titres
- `titlePrimary` → text-orange-400
- `titleHeader` → text-orange-300

## 🎨 Changer les couleurs

Pour changer les couleurs de toute l'application :

1. **Éditer `src/styles/colors.css`** pour les variables CSS
2. **Éditer `src/constants/colors.js`** pour les classes Tailwind

```css
/* src/styles/colors.css */
:root {
  --color-primary: #f97316; /* Changer cette valeur */
  --bg-primary: #0f172a;     /* Changer cette valeur */
}
```

```js
// src/constants/colors.js
export const COLOR_CLASSES = {
  textPrimary: 'text-orange-400', // Changer orange-400 par la nouvelle couleur
  bgPrimary: 'bg-slate-900',      // Changer slate-900 par la nouvelle couleur
}
```

## ❌ Ce qu'il ne faut PAS faire

```vue
<!-- ❌ Ne fonctionne pas avec Tailwind -->
<div :class="`text-${color}-400`">Texte</div>

<!-- ❌ Ne fonctionne pas -->
<div :class="'bg-' + backgroundColor">Fond</div>

<!-- ✅ À la place, utiliser -->
<div :class="COLOR_CLASSES.textPrimary">Texte</div>
```
