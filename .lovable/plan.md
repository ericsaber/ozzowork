

## Plan: Update FollowupCard Display for New Data Model

### Changes

**1. `src/components/FollowupCard.tsx`** — Main changes:

- Add new props: `connectType: string | null`, `interactionDate: string`
- Rename label "Last Interaction" → "Last connect" with updated styles (9px, uppercase, letter-spacing 0.1em, weight 500, #bbb)
- Add connect pill below label when `connectType` is not null: inline-flex, bg `#e8e4de`, color `#666`, border-radius 20px, padding 3px 9px, 10px font, icon (10px) + past-tense verb + date (e.g. "Called · Mar 9")
- Past-tense verb map: call→Called, email→Emailed, text→Texted, meet→Met, video→Video called
- Note text below pill: 11px, #777, line-clamp-2
- Update `typeIcon` map: remove `voicemail`, add `meet: Users`, `video: Video`
- The due pill icon already uses `interactionType` which maps to `planned_follow_up_type` — just update the icon map to include meet/video and remove voicemail

**2. `src/pages/Today.tsx`** — Pass new props to FollowupCard:

- Add `connectType={item.connect_type}` and `interactionDate={item.date}` to renderCard

**3. Remove Voicemail references** from:

- `src/components/FollowupCard.tsx` — remove from import and typeIcon map
- `src/components/InteractionItem.tsx` — remove voicemail from imports, typeIcons, typeLabels; add meet/video
- `src/components/EditInteractionDialog.tsx` — remove voicemail option from type options; add meet/video
- `src/pages/FollowupTask.tsx` — remove voicemail from imports, typeIcons, typeLabels; add meet/video

### No database changes needed — purely display updates.

