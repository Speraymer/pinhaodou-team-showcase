# Design QA

## Visual comparison

The implementation preserves the deep-space composition, central team subject, orbital language, ten visible member entries, and direct profile access. The `frontend-design` pass replaces generic neon pills, all-caps labels, and a rounded card rail with a restrained Chinese astronomical-observatory system: a Song-style title, crosshair mark, thin coordinate labels, and a ruled member index. YING's real avatar remains the center; every other member keeps an independently tilted three-axis orbit.

## Interaction verification

- Mouse drag rotates freely on both axes with no vertical clamp; two full-height drags complete roughly one 360-degree turn without opening a profile.
- Wheel zoom reaches a wide constellation overview and a close portrait view.
- Every member has a shareable `?member=<slug>` profile URL.
- Opening a profile moves focus to “返回星图”; Escape closes it and restores focus to the triggering member.
- Reduced-motion preference stops automatic constellation motion and orbital animation.

## Browser result

The final local page rendered without runtime errors at desktop and narrow in-app-browser widths. All ten member portraits remained reachable, YING stayed the primary center, the orbital planes showed depth when rotated, and the narrow layout started farther from the constellation so edge nodes were not lost. The profile view, Escape close, focus restoration, and hidden mobile scrollbar were checked in the browser.
