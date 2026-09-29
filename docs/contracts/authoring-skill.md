# Contract: `compose-page` authoring skill

`.claude/skills/compose-page/SKILL.md` composes a page from the existing blocks.

**Input.** A page brief (purpose, sections, audience), optionally with a target collection:
pages, services, industries, caseStudies, workshops, teamMembers or the homepage.

**Output, exactly one of:**

1. **A `layout`.** An ordered blocks array using only registered blocks (`BLOCK_LIBRARY.md` §5),
   with each block's fields filled in. It follows the reading-column rule (`DESIGN_SYSTEM.md`
   §11.4), is shaped as content JSON for `tools/payload-seed`, and contains no page code.
2. **One named block gap.** When no block can do what the brief needs, the output names the missing
   capability and why. Usually the fix is an option on an existing block; a new block needs the
   owner's sign-off (ADR 0013).

**Guarantees.**

- It never emits React or template code for a page.
- It only uses block slugs present in `registry.ts`.
- It covers AICO metadata needs (`CONTENT-REQUIREMENTS.md` §8).

`tests/int/skills/composePage.int.spec.ts` checks the output shape.
