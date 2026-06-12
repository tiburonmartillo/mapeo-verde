# Image Upload Test Cases

## Overview
This document describes test cases for all image upload flows in Mapeo Verde.

## Upload Flows

### 1. AdminEventsPage - Event Banner Upload
**Location**: `/admin` → "Nuevo evento" or "Editar" → "Cartel del evento o imagen"

**Validation Rules**:
- Allowed types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Max size: 5 MB
- Shows preview after selection
- Shows error for invalid format/size
- Uploads to Supabase Storage bucket `event_banners`

**Test Cases**:
| Test | Input | Expected Result |
|------|-------|-----------------|
| Valid JPEG | `test.jpg` (2 MB) | ✅ Upload succeeds, preview shows |
| Valid PNG | `test.png` (3 MB) | ✅ Upload succeeds, preview shows |
| Valid WebP | `test.webp` (1 MB) | ✅ Upload succeeds, preview shows |
| Valid GIF | `test.gif` (4 MB) | ✅ Upload succeeds, preview shows |
| Invalid type (PDF) | `test.pdf` | ❌ Error: "Formato no válido. Usa JPEG, PNG, WebP o GIF." |
| Invalid type (SVG) | `test.svg` | ❌ Error: "Formato no válido..." |
| Too large (>5MB) | `large.jpg` (6 MB) | ❌ Error: "La imagen excede 5 MB." |
| No file selected | (empty) | ✅ Allows submit without image |

**URL Input Alternative**: Can paste HTTPS URL directly in URL field

---

### 2. OrganizationProfileForm - Organization Logo Upload
**Location**: `/admin/cuenta` → "Logo o imagen" section

**Validation Rules**:
- Allowed types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Max size: 2 MB (stricter than events)
- Shows preview with alt text "Logo de la organización"
- Shows error for invalid format/size
- Uploads to Supabase Storage bucket `organization_logos`

**Test Cases**:
| Test | Input | Expected Result |
|------|-------|-----------------|
| Valid JPEG | `logo.jpg` (1 MB) | ✅ Upload succeeds, preview shows |
| Valid PNG | `logo.png` (1.5 MB) | ✅ Upload succeeds, preview shows |
| Valid WebP | `logo.webp` (500 KB) | ✅ Upload succeeds, preview shows |
| Valid GIF | `logo.gif` (1.8 MB) | ✅ Upload succeeds, preview shows |
| Invalid type (PDF) | `logo.pdf` | ❌ Error: "Formato no válido. Usa JPEG, PNG, WebP o GIF." |
| Too large (>2MB) | `logo.jpg` (3 MB) | ❌ Error: "La imagen excede 2 MB." |
| Remove logo | Click "Quitar imagen" | ✅ Clears preview and URL |

---

### 3. ParticipationPage - Event Banner Upload (Public Form)
**Location**: `/participacion` → "Evento para agenda" → "Cartel del evento o imagen"

**Validation Rules**:
- Allowed types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Max size: 5 MB
- Shows preview with `SafeImage` component
- Separate error display below file input
- Client-side validation before upload
- Uploads to Supabase Storage bucket `event_banners` on submit

**Test Cases**:
| Test | Input | Expected Result |
|------|-------|-----------------|
| Valid JPEG | `event.jpg` (2 MB) | ✅ Preview shows, no error |
| Valid PNG | `event.png` (3 MB) | ✅ Preview shows, no error |
| Valid WebP | `event.webp` (1 MB) | ✅ Preview shows, no error |
| Valid GIF | `event.gif` (4 MB) | ✅ Preview shows, no error |
| Invalid type (PDF) | `event.pdf` | ❌ Red error: "Formato no válido..." + no preview |
| Invalid type (SVG) | `event.svg` | ❌ Red error: "Formato no válido..." + no preview |
| Too large (>5MB) | `event.jpg` (6 MB) | ❌ Red error: "La imagen excede 5 MB..." + no preview |
| No file selected | (empty) | ✅ Shows "Sin archivo seleccionado" |

---

### 4. Image Display with SafeImage Fallback
**Components using SafeImage**:
- GreenAreasPage (grid cards + detail view)
- GreenAreaDetailPage (hero + gallery)
- ImpactDetailPage (hero + markdown images + modal)
- FeaturePreview (hover cards)
- LinktreePage (social logos)
- AdminEventsPage (preview)
- OrganizationProfileForm (logo preview)
- ParticipationPage (preview)

**Fallback Behavior**:
- On load error → tries `fallbackUrl` if provided
- On fallback error → shows `TreePine` icon
- `loading="lazy"` on all instances

**Test Cases**:
| Scenario | Expected Result |
|----------|-----------------|
| Valid image URL | ✅ Image loads |
| Broken image URL | ✅ Shows TreePine icon (gray, opacity-40) |
| Empty src | ✅ Shows TreePine icon immediately |
| Slow network | ✅ Shows loading state, then image or fallback |

---

### 5. Instagram SVG Replacement
**Location**: LinktreePage - Instagram card

**Implementation**: Inline SVG with gradient (no external file)
- No more 10MB `Instagram_Glyph_Gradient.svg` asset
- Uses `<svg>` with gradient definition

---

## Running Tests

### Manual Testing Checklist
1. Start dev server: `npm run dev`
2. Navigate to each upload form
3. Test each case in the tables above
4. Verify error messages appear in red
5. Verify previews display correctly
6. Verify form submission works with/without images

### Automated Testing (if available)
```bash
# Run unit tests
npm test

# Run type check
npx tsc --noEmit

# Run lint
npm run lint
```

---

## Environment Requirements
- Supabase project with storage buckets:
  - `event_banners` (public)
  - `organization_logos` (public)
- Storage policies allowing authenticated uploads
- CORS configured for Supabase Storage

---

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "Bucket not found" | Create bucket in Supabase Dashboard → Storage |
| CORS errors | Add `http://localhost:5173` to Supabase CORS config |
| 403 Forbidden | Check RLS policies on storage.objects |
| Preview not showing | Check `SafeImage` component has correct `src` prop |
| Large file upload fails | Verify `MAX_SIZE` constants match server limits |

