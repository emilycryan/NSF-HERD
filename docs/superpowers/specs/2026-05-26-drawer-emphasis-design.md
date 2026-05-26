# Drawer emphasis + warning-yellow Changes card

**Date:** 2026-05-26
**Status:** Approved (design); pending implementation plan
**Scope:** Pure CSS. Single file change.

## Purpose

The survey main pane stacks up to 17 accordion drawers. As respondents work through them, several end up open at once and it becomes hard to see — at a glance — which drawers hold the content they're focused on versus which are collapsed for context. Two small visual changes fix this:

1. Make **open** drawers feel like the active work surface and **closed** drawers visibly recede.
2. Stop using info-blue as a general "draw attention" treatment on the **FY 2024 Survey Changes and Definitions** card; switch it to warning-yellow so info-blue stays reserved for genuine data-mismatch signals.

## Out of scope

Listed explicitly so we don't drift:

- The left sidebar (`.app-sidebar`, `.sidebar-item`) — unchanged.
- The smaller `.content-callout` blocks inside drawer bodies — also blue today. Same color rule applies, but kept out of scope to keep this change reviewable. Flagged as a follow-up.
- Drawer behavior — many can still be open at once; no auto-close, no scroll-to behavior.
- Sidebar-driven drawer opening — not wired up today, not added here.
- Tuning closed-drawer values beyond what's specified — can revisit after seeing it live.

## File touched

- `css/components.css` — modify the `.usa-accordion` ruleset and the `.changes-card` ruleset. No new files, no new tokens.

## Design — drawer emphasis (Direction C2, "neutral lift")

Drawers have two visual states driven by `aria-expanded` on the inner `<button class="usa-accordion__button">`. The `.usa-accordion` wrapper itself does not carry state today, so the implementation hangs styles off the wrapper via `:has(button[aria-expanded="true|false"])`. That keeps both the button and the expanded content panel inside one elevated visual unit per state, instead of styling them in three places.

### Open state — `.usa-accordion:has(button[aria-expanded="true"])`

The open drawer is a unified visual card composed of two existing DOM elements: the button (top) and the content panel (bottom). The shadow goes on the wrapper so it wraps the whole card; the border color override has to be applied to both inner elements because that's where the borders physically live today.

| Target | Property | Value |
|---|---|---|
| `.usa-accordion` wrapper | `box-shadow` | `0 4px 14px rgba(15, 23, 42, 0.10)` |
| `.usa-accordion__button` | `border-color` | `#d2d6de` (one step darker than current `--color-card-border`) |
| `.usa-accordion__content` | `border-color` | `#d2d6de` (matches the button) |
| `.usa-accordion__button` title text | `color` | `var(--color-primary-dark)` (#1c2434) |
| `.usa-accordion__button` title text | `font-weight` | `600` (up from current `500`) |

Button background stays white (the existing `.usa-accordion__button` rule already sets `var(--color-surface) !important`). Padding, chevron rotation, and the no-top-border on the content panel are unchanged.

### Closed state — `.usa-accordion:has(button[aria-expanded="false"])`

Only the button is visible when the drawer is closed (the content panel carries the `hidden` attribute). So this is really just a button restyle.

| Target | Property | Value |
|---|---|---|
| `.usa-accordion` wrapper | `box-shadow` | none |
| `.usa-accordion__button` | `background-color` | `#f3f5f8` |
| `.usa-accordion__button` | `border-color` | `#e0e3e8` |
| `.usa-accordion__button` title text | `color` | `var(--color-text-subtle)` (#5e6573) |
| `.usa-accordion__button` title text | `font-weight` | `500` (unchanged) |
| `.accordion-number` | `color` | `var(--color-text-subtle)` |
| `.accordion-chevron` | `color` | `var(--color-text-subtle)` |

**Why not `opacity: 0.5`?** Opacity composites the wrapper's contents toward the page background. A naive `opacity: 0.5` rendered the closed-drawer title text at an effective `#A4A8B1` on `#F3F5F9` — contrast ratio 2.18:1, failing WCAG AA badly. Directly authored colors avoid this. `#5e6573` on `#f3f5f8` lands at **≈ 5.05:1**, comfortably above the 4.5:1 floor.

### Transitions

Transitions go on the same elements the properties go on. The wrapper transitions its shadow; the button transitions its bg + border + text color.

```css
.usa-accordion {
  transition: box-shadow 0.15s ease;
}

.usa-accordion__button {
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease !important;  /* !important to win over USWDS reset */
}

@media (prefers-reduced-motion: reduce) {
  .usa-accordion,
  .usa-accordion__button { transition: none !important; }
}
```

The chevron rotation transition (`transform 0.15s ease`) already exists on `.accordion-chevron` and is not changed.

### Hover

The existing `.usa-accordion__button:hover` rule sets bg to `var(--color-section-header)` (#F3F3F3). On a closed drawer (resting bg `#f3f5f8`) the hover shift is intentionally subtle — close to a no-op visually. That's acceptable: the primary "this drawer is wakeable" affordance is the cursor pointer and the focus ring, not a bg color change. If the implementation makes the closed hover state feel completely flat, bump the closed hover to a slightly darker tint during implementation; otherwise leave it.

### Focus visibility

USWDS owns the focus-visible outline on `.usa-accordion__button` and that ring is not touched here. Closed drawers receive the same focus treatment as open ones, so keyboard navigation through 17 collapsed drawers is unaffected.

### Specificity / `!important` note

The current `.usa-accordion__button` rule uses `!important` on most properties to override USWDS's CDN-loaded styles. Any selector that targets the button via `.usa-accordion:has(...) .usa-accordion__button` must also use `!important` on the same properties (bg, border, color) to win the cascade. The wrapper-level shadow does **not** need `!important` because the existing `.usa-accordion` rule does not declare `box-shadow`.

## Design — warning-yellow Changes card

The `.changes-card` rule currently uses three blue values. Each gets swapped for its warning-palette counterpart:

| Property | Before | After |
|---|---|---|
| `background-color` | `var(--color-info-bg)` (#EFF6FF) | `var(--color-warning-bg)` (#FEF9C3) |
| `border` | `1px solid #d8e6fb` | `1px solid #FDE68A` |
| `border-left` | `4px solid var(--color-stroke-active)` (#3B82F6) | `4px solid var(--color-warning)` (#F59E0B) |

No new tokens. The `#FDE68A` border tint follows the existing inline-literal pattern used for the current `#d8e6fb` border tint — keeping that as a literal rather than minting a `--color-warning-border` token, since this is the only place it's used and we can extract later if a second site appears.

Body text color (`var(--color-text-muted)`) is unchanged; against the new `#FEF9C3` background it still clears WCAG AA easily.

## Accessibility

| Pair | Ratio | Threshold | Result |
|---|---|---|---|
| Open drawer title `#1c2434` on `#fff` | ≈ 16.9:1 | 4.5:1 (AA body) | AAA |
| Closed drawer title `#5e6573` on `#f3f5f8` | ≈ 5.05:1 | 4.5:1 (AA body) | AA |
| Closed drawer number/chevron `#5e6573` on `#f3f5f8` | ≈ 5.05:1 | 3:1 (UI/large) | AA |
| Changes card heading `#1c2434` on `#FEF9C3` | ≈ 17:1 | 4.5:1 | AAA |
| Changes card body `#333333` on `#FEF9C3` | ≈ 13.6:1 | 4.5:1 | AAA |

`prefers-reduced-motion: reduce` disables the wrapper transition.

## Browser support

The implementation depends on the CSS `:has()` selector. Supported in:

- Safari 15.4+ (March 2022)
- Chrome 105+ (August 2022)
- Firefox 121+ (December 2023)

The project README states the prototype is "for design review only," so this is in bounds. If a non-evergreen browser ever becomes a target, the same effect can be reproduced by mirroring the open/closed state onto the wrapper via a tiny JS hook in `app.js` (in the existing `wireAccordions` function) — but that's not built here.

## Verification plan

After implementation:

1. Start the local server (`python3 -m http.server 8000`).
2. Load the page and confirm initial state: all drawers collapsed and showing the closed treatment (gray surface, subtle text).
3. Expand drawer 6 and confirm: white surface, drop shadow, darker border, heavier title; the body panel below reads as part of the same raised card.
4. Expand drawer 8 with 6 still open: both drawers carry the open treatment simultaneously.
5. Collapse drawer 6 and confirm the transition feels smooth (~150ms) and ends in the closed state.
6. Tab through several closed drawers and confirm the focus ring is visible on each.
7. Hover a closed drawer and confirm the header tints slightly without conflicting with the closed styling.
8. Open browser devtools, sample the closed-drawer title text, and confirm a contrast checker reports ≥ 4.5:1 against the closed-drawer surface.
9. Confirm the Changes card reads as yellow, not blue, and that its heading and body text both clear WCAG AA against the new background.
10. Set `prefers-reduced-motion: reduce` in OS settings (or via devtools emulation) and confirm the state changes are instant.

## Follow-ups (not part of this change)

- `.content-callout` — same color rule probably wants to apply, but each use should be reviewed for "is this a mismatch signal or a draw-attention signal?" before swapping.
- Sidebar item — could mirror "which drawer am I in" if the sidebar ever becomes a navigator into the main pane.
- Sidebar click → expand-and-scroll behavior — currently the sidebar buttons have no click handlers wired up. Separate piece of work.
