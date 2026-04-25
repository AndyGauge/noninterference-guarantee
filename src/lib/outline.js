// Noninterference for LLM Tool Schemas — research talk, 25 min, 5 sections.
//
// Draws directly from the paper "Type-State Authorization for LLM Tool
// Schemas: A Formal Model with Noninterference Guarantees."
//
// Each card has:
//   - num         two-digit slide id (assigned automatically)
//   - section     id from `sections` below
//   - kind        'divider' | 'content' | 'code' | 'close'
//   - title       slide headline
//   - gist        one line under the title (optional)
//   - code        { lang, body } for code/math slides (optional)
//   - points      array of short bullets (optional)
//   - duration    minutes budgeted to this card
//   - notes       rehearsal markdown — appears BELOW the fold, not projected

export const sections = [
  { id: 'problem',    label: 'The Problem' },
  { id: 'shaping',    label: 'Schema-level Authorization' },
  { id: 'theorem',    label: 'Noninterference' },
  { id: 'rust',       label: 'The Rust Type-State' },
  { id: 'five-langs', label: 'Five Languages' }
];

const raw = [
  // ── 1. The Problem (5 min) ───────────────────────────────────────────────
  {
    section: 'problem',
    kind: 'divider',
    title: 'The Problem',
    gist: 'The schema is the channel.',
    duration: 0.5,
    notes:
      'Set the section in one breath. "The thing we usually treat as a contract — the tool schema — is also an information channel. That is the problem this talk is about." Then move.'
  },
  {
    section: 'problem',
    kind: 'content',
    title: 'Same MCP server. Every principal sees the same shape.',
    gist: '`tools/list` is invariant. Authorization is post-hoc rejection. The model already saw the field.',
    points: [
      'JSON-RPC discovery: names, descriptions, input + output JSON Schemas',
      'Static across principals — no per-user variation in the spec',
      'Auth check happens at `tools/call`, not at `tools/list`',
      'By the time the call is rejected, the field name is already in context'
    ],
    duration: 1.5,
    notes:
      'Cite §I and §I-A. Set up the asymmetry: in human UIs, post-hoc rejection works because the user reads the error and adjusts. LLM clients do not exhibit that corrective behavior reliably — empirical observations in production MCP deployments give us three concrete failure modes, which is the next slide.\n\nDeliver the *"the model already saw the field"* line slowly. It is the line you want quoted.'
  },
  {
    section: 'problem',
    kind: 'content',
    title: 'Three failures, observed in production.',
    points: [
      '**Hallucinated invocation** — model retries with parameters from the rejected schema',
      '**Capability disclosure in natural language** — model names unauthorized tools to the user from descriptions it read',
      '**Error-message amplification** — rejection text re-enters the context window and shapes subsequent turns'
    ],
    duration: 1.5,
    notes:
      'These are the §I-A enumeration. Each one is a real, measurable failure under post-hoc rejection. The point is that "rejection at invocation" is *not* a sufficient enforcement boundary for an LLM — the field never had to be invoked to leak.\n\nIf an audience member pushes back with "isn\'t this just bad prompt engineering?" — no. The schema is structured input, not natural language. We are arguing this is an architectural disclosure, not a behavioral one.'
  },
  {
    section: 'problem',
    kind: 'content',
    title: 'Schema discloses three things.',
    gist: 'Existence. Structure. Boundary.',
    points: [
      '**Existence** — the field name reveals the capability is in the system',
      '**Structure** — its type and constraints reveal its shape',
      '**Boundary** — its presence next to ungated fields delineates the authorization surface',
      'All three occur at *schema-serving time*, before any invocation attempt'
    ],
    duration: 1.5,
    notes:
      'Cite §I-B. In information-flow language (Volpano-Smith, JFlow), the schema-serving endpoint constitutes an *implicit flow*: the presence or absence of an element is observable by the principal and is correlated with the server\'s authorization structure.\n\nTransition: "If this is information disclosure, then we should attack it the way we attack every other implicit flow — eliminate it. Remove the gated elements before serving."'
  },

  // ── 2. Schema-level Authorization (4 min) ────────────────────────────────
  {
    section: 'shaping',
    kind: 'divider',
    title: 'Schema-level Authorization',
    gist: 'What if the field was never there?',
    duration: 0.5,
    notes:
      'The thesis line of the talk. Project, pause, and say it out loud: *"What if the field was never there?"* Then the next slide makes the question concrete.'
  },
  {
    section: 'shaping',
    kind: 'content',
    title: 'Manager. Operator. Same endpoint.',
    gist: 'Same tool. Same code. Two principals. Two schemas. The operator\'s schema is indistinguishable from a server that never defined `salary_band`.',
    compare: {
      left: {
        label: 'Manager — schema served',
        body: `{
  "type": "object",
  "properties": {
    "id":          { "type": "string" },
    "name":        { "type": "string" },
    "salary_band": { "type": "string" }
  },
  "required": ["id", "name", "salary_band"]
}`
      },
      right: {
        label: 'Operator — schema served',
        body: `{
  "type": "object",
  "properties": {
    "id":   { "type": "string" },
    "name": { "type": "string" }
  },
  "required": ["id", "name"]
}`
      }
    },
    duration: 1.0,
    notes:
      'This slide is the visual answer to the divider question. Two JSON Schemas, returned by the same `tools/list` endpoint to two different principals on two requests milliseconds apart.\n\nWalk the audience through what is *not* on the operator\'s side:\n\n- `salary_band` is gone from `properties` — not present, not nulled, not redacted.\n- It is gone from `required` — the schema is internally consistent.\n- There is no marker, no comment, no field-level "denied" sentinel. It is structurally absent.\n\nThe punch is the line in the gist: *the operator\'s schema is indistinguishable from a server that never defined `salary_band`*. That sentence is the prose form of the noninterference theorem you will state in section 3. Land it now, and the theorem two sections later feels inevitable.\n\nNote: the field came from a single source-level annotation — `#[requires("manager")]` on `salary_band`. No conditional rendering, no second handler, no per-role schema definition.'
  },
  {
    section: 'shaping',
    kind: 'code',
    title: 'The labeling.',
    gist: 'Every schema element gets a capability label. Or none.',
    code: {
      lang: 'text',
      body: `C            — set of capability names

K  ⊆  C      — principal's clearance set (per request)

ℓ : E → C ∪ {⊥}      — labeling function`
    },
    points: [
      '`C` is the alphabet of capabilities (e.g. `manager`, `admin`)',
      '`K` is what the principal *holds* — a subset of `C`, supplied per request',
      '`ℓ(e) = c` if `e` carries `#[requires("c")]`; otherwise `ℓ(e) = ⊥`',
      '`⊥` is the *ungated* label — visible to every principal'
    ],
    duration: 0.75,
    notes:
      'This slide is the vocabulary every later slide stands on. Read each symbol once, slowly, and do not rush.\n\n- `C` — the universe of capability names; finite set.\n- `K` — the principal\'s clearance, a subset of `C`. *Per request*, not per session.\n- `ℓ` — one labeling function. The annotation `#[requires("c")]` is what assigns `ℓ(e) = c`. Same annotation Steep already type-checks; we read it at request time.\n- `⊥` — bottom, the ungated label. Pronounce it "bottom" aloud the first time.\n\nCite Definitions III.1 (Capabilities), V.2 (Labeling function), V.3 (Principal clearance).'
  },
  {
    section: 'shaping',
    kind: 'code',
    title: 'Element-level shaping.',
    gist: 'Survive iff your label is `⊥` or in `K`.',
    code: {
      lang: 'text',
      body: `σ_I(I, K) = { f ∈ I  |  ℓ(f) = ⊥ ∨ ℓ(f) ∈ K }    — input fields

σ_O(O, K) = { v ∈ O  |  ℓ(v) = ⊥ ∨ ℓ(v) ∈ K }    — output variants`
    },
    points: [
      'One predicate, applied at two structural layers',
      'No transformation, no mapping — pure inclusion',
      'The element either survives or it does not',
      'Definitions III.6 and III.7 in the paper'
    ],
    duration: 0.75,
    notes:
      'Read the formula aloud as: *"sigma sub I of I and K equals the set of fields f in I whose label is bottom or in K."*\n\nThe key word is *or*. Ungated elements (`ℓ(f) = ⊥`) survive unconditionally. Gated elements survive iff their label is in the principal\'s clearance.\n\nNothing is *modified*. The schema shaper does not rewrite types, does not relax constraints, does not collapse unions. It removes elements. The schemas that come out are well-formed sub-schemas of the originals.\n\nCite Definitions III.6, III.7.'
  },
  {
    section: 'shaping',
    kind: 'code',
    title: 'Tool and server shaping.',
    gist: 'Three layers compose. One predicate everywhere.',
    code: {
      lang: 'text',
      body: `σ_T(T, K) = (name, desc, σ_I(I, K), σ_O(O, K), auth)

σ(S, K)   = { σ_T(T, K)  |  T ∈ S ∧ vis(T, K) }

         where  vis(T, K)  ⟺  auth(T) = ⊥  ∨  auth(T) ∈ K`
    },
    points: [
      '**Tool visibility** — `vis(T, K)` removes the entire tool when its gate is unmet',
      '**Input field shaping** — `σ_I` filters parameters the principal cannot see',
      '**Output variant shaping** — `σ_O` filters branches of the response union',
      'All three layers answer to the same predicate: *"is this label in `K ∪ {⊥}`?"*'
    ],
    duration: 1.0,
    notes:
      'Definitions III.8 and III.9. This is where the layers compose.\n\nWalk the audience up the structure:\n\n1. `σ_I` and `σ_O` filter *within* a tool definition.\n2. `σ_T` lifts that to a *whole tool* — same name, same description, but shaped input and shaped output schemas.\n3. `σ` lifts again to a *whole server* — and adds the tool-visibility gate `vis(T, K)`, which removes tools the principal cannot invoke at all.\n\nThe punchline: same elementary predicate, three structural layers. The case study in §VII-E exercises all three (8 tools, 12 gated fields, 3 gated variants).\n\nWhy is this important for the proof? Each layer is *independently* a downward closure on the security lattice. Composition of downward closures is a downward closure. That is the structural property the noninterference proof uses on the next section.'
  },

  // ── 3. Noninterference (8 min) ───────────────────────────────────────────
  {
    section: 'theorem',
    kind: 'divider',
    title: 'Noninterference',
    gist: 'The principal cannot tell the gated capability exists.',
    duration: 0.5,
    notes:
      'The heart of the talk. The next four slides build to the theorem and its consequence.'
  },
  {
    section: 'theorem',
    kind: 'code',
    title: '`K`-equivalence.',
    gist: 'Two servers are K-equivalent iff they differ only in elements labeled with capabilities not in K.',
    code: {
      lang: 'text',
      body: `S₁  ≈_K  S₂   ⟺   ∀ e.  ℓ(e) ∈ K ∪ {⊥}  ⟹  (e ∈ S₁  ⟺  e ∈ S₂)`
    },
    points: [
      'For elements *visible to* the principal (label `⊥` or in `K`), the two servers are bit-identical',
      'For elements *not visible*, the servers may differ arbitrarily',
      'This is the indistinguishability relation we want `σ` to preserve'
    ],
    duration: 1.5,
    notes:
      'Definition III.10. Read the formula aloud as: *"for every element e whose label is bottom or in K, e is in S₁ iff e is in S₂."*\n\nThis is the standard low-equivalence relation from Sabelfeld and Myers, instantiated for our flat lattice. The principal\'s "low view" is K ∪ {⊥}; everything labeled with c ∉ K is "high."'
  },
  {
    section: 'theorem',
    kind: 'code',
    title: 'Theorem III.4 — Noninterference.',
    gist: 'Equivalence in the input. Equality in the output.',
    code: {
      lang: 'text',
      body: `S₁  ≈_K  S₂   ⟹   σ(S₁, K)  =  σ(S₂, K)`
    },
    points: [
      'For any two servers that differ only in capabilities the principal lacks',
      'The shaped schemas they serve that principal are **bit-for-bit identical**',
      'Not "indistinguishable in expectation" — equal',
      'The principal cannot tell whether the gated capability exists'
    ],
    duration: 2.5,
    notes:
      'The headline theorem. State it plainly: *"if two servers agree on what the principal can see, they agree on the schema served to that principal — exactly."*\n\nThe word that does the work is *equal*, not *indistinguishable*. This is a stronger statement than typical noninterference results in language-based security, and it falls out of the structure of the projection: σ is a deterministic function of the principal\'s clearance and the visible elements only.\n\nWhy is this strong enough? Because the shape an LLM observes is the entire information channel. If the shape is bit-equal, the channel transmits zero bits about gated state.'
  },
  {
    section: 'theorem',
    kind: 'content',
    title: 'Three cases. One structural induction.',
    gist: 'Tool · field · variant. Each layer preserves K-equivalence; composition does too.',
    points: [
      '**Tool-level** — `auth(T) = c ∉ K` excludes T from both `σ(S₁, K)` and `σ(S₂, K)`',
      '**Field-level** — `ℓ(f) = c ∉ K` excludes f from `σ_I(I, K)`',
      '**Variant-level** — analogous to fields, on output unions',
      'Each layer is a downward closure on the security lattice; their composition is too'
    ],
    duration: 2.0,
    notes:
      'Cite the proof in §III-D. Walk all three cases very briefly — the audience does not need every line, they need the *shape*.\n\nKey lemmas to mention by number: Theorem III.1 (Monotonicity), Theorem III.2 (Idempotence), Theorem III.3 (Intersection). These are the structural properties that make the layers compose. They\'re short, mechanical proofs; do not labor them in the talk, just point at them and say "these compose."'
  },
  {
    section: 'theorem',
    kind: 'content',
    title: 'A flat security lattice. A downward closure.',
    gist: 'In Denning\'s 1976 sense.',
    points: [
      'Lattice `L = {⊥} ∪ C` with order: `⊥ ≤ c` for all c, and `c ≰ d` for distinct c, d',
      '`σ(S, K)` retains exactly the elements whose label is dominated by the principal\'s clearance',
      'No transitive flows · no label joins · no implicit flows',
      'Hierarchical capabilities deepen the lattice; the proof generalizes with minor changes'
    ],
    duration: 1.5,
    notes:
      'Cite §V. Connect the formalism back to Denning\'s 1976 lattice model and Sabelfeld+Myers 2003. We are not inventing security typing — we are instantiating the canonical model in a place that has not seen it before: the JSON Schema served at the boundary of an LLM agent.\n\nIf someone asks about hierarchical capabilities (admin > manager > operator), point at §VIII-C: replace `ℓ(e) ∈ K` with `ℓ(e) ≤ max(K)` and the proof carries with minor edits.'
  },

  // ── 4. The Rust Type-State (5 min) ───────────────────────────────────────
  {
    section: 'rust',
    kind: 'divider',
    title: 'Compile-time enforcement',
    gist: 'If you have a `Proof<C>`, you held capability C.',
    duration: 0.5,
    notes:
      'Pivot from the model to the encoding. The model is language-agnostic — five implementations realize it. But one of them gets to make the static guarantee.'
  },
  {
    section: 'rust',
    kind: 'code',
    title: '`Proof<C>` — a sealed witness.',
    code: {
      lang: 'rust',
      body: `pub trait Capability: Send + Sync + 'static {
    const NAME: &'static str;
}

pub struct Proof<C: Capability> {
    _marker: PhantomData<C>,        // pub(crate) — externals cannot construct
}

impl AuthContext {
    pub fn check<C: Capability>(&self) -> Option<Proof<C>> {
        if self.capabilities.contains(C::NAME) {
            Some(Proof { _marker: PhantomData })
        } else {
            None
        }
    }
}`
    },
    duration: 2.0,
    notes:
      'Walk it line by line.\n\n- `Capability` is a sealed marker trait — every gated operation gets a unit type implementing it (`struct Manager;`, `struct Admin;`).\n- `Proof<C>` is parameterized over the capability. The single field has crate-private visibility, which is the linchpin.\n- `AuthContext::check` is the *sole* public constructor. It runs the capability-set membership test and returns `Some(Proof { … })` or `None`.\n- A function whose signature includes `Proof<C>` cannot be called without going through `check`.\n\nThis is §IV-A. The `compile_fail` doc test (§VII-A) mechanically verifies that direct construction outside the module fails to compile.'
  },
  {
    section: 'rust',
    kind: 'content',
    title: 'Curry-Howard: "C has been verified."',
    gist: 'The type is the proposition. A value of that type is a constructive proof.',
    points: [
      '`Proof<C>` ↔ proposition *"C has been verified"*',
      '`fn(Proof<C>) → R` ↔ implication *C ⟹ R*',
      '`Option<Proof<C>>` ↔ decidability — the check returns Some or None',
      '`(Proof<C>, Proof<D>)` ↔ conjunction — both held'
    ],
    duration: 1.5,
    notes:
      'Cite §IV-B. The encoding admits a direct Curry-Howard reading: the type is the proposition, the value is the proof, the function arrow is implication.\n\nName the limitation aloud: this expresses *"the check was performed,"* not *"the check should succeed."* The latter would require dependent types — `Proof<C, principal=p, time=t>`. We point at Idris and F* (Fine, Swamy et al.) as the path to closing the temporal gap, and we identify it as future work in §VIII-B.\n\nIf the audience is sharp on type theory, this is where they are — let the slide breathe and take the question.'
  },
  {
    section: 'rust',
    kind: 'content',
    title: 'Zero-sized. Zero-cost. Unforgeable.',
    points: [
      '`size_of::<Proof<C>>()` evaluates to `0` for every `C` — `PhantomData` erases at monomorphization',
      'Per-request cost: capability-set membership test (`HashSet::contains`, expected `O(1)`)',
      'Six forgery paths — direct construction, transmute, zeroed, deserialize, default/from, clone — all blocked under safe Rust',
      'Static guarantee = unique to Rust. The other four implementations match `σ` but rely on developer discipline.'
    ],
    duration: 1.0,
    notes:
      'Cite §IV-C for the six attack mechanisms (the one each developer asks about, enumerated and refuted), §IV-D for zero-cost. The headline figure: full input + output shaping pass for the case-study tool suite (8 tools, 47 fields, 5 unions) completes in **under 50µs on an Apple M1**. Network round-trip dwarfs that.\n\nThe last bullet is the honesty statement. The model is portable; the static guarantee is not. That is exactly the kind of claim a reviewer respects.'
  },

  // ── 5. Five Languages (3 min) ────────────────────────────────────────────
  {
    section: 'five-langs',
    kind: 'divider',
    title: 'Five Languages',
    gist: 'Same projection. Different enforcement story.',
    duration: 0.5,
    notes:
      'Final substantive section. Land the cross-language uniformity claim and the asymmetry of static enforcement.'
  },
  {
    section: 'five-langs',
    kind: 'code',
    title: 'One `σ`. Five enforcements.',
    code: {
      lang: 'text',
      body: `Lang   Predicate          Annotation              Static
─────────────────────────────────────────────────────────
Ruby   can?(:sym)         @requires(:s)            No
TS     ctx.can(s)         .requires(s)             No
Py     ctx.can(s)         requires(s)              No
C#     ctx.Can(s)         [Requires(s)]            No
Rust   auth.check<C>()    #[requires("c")]         Yes`
    },
    points: [
      'Authorization semantics identical across all five — verified by JSON output equivalence',
      'Per-request cost identical: capability membership test + JSON mutation',
      'Annotation burden for the case-study suite (8 tools, 12 gated fields, 3 gated variants): 15 `#[requires]` annotations, 8 registration calls in Rust',
      'Ruby implementation required building an RBS-to-JSON-Schema compiler from scratch (~850 LOC) — no prior tooling existed'
    ],
    duration: 2.5,
    notes:
      'This is the cross-language uniformity claim, Claim 4 in the abstract. The schema-shaping semantics can be implemented uniformly across languages with differing type-system expressiveness; the static enforcement guarantee of Theorem IV.1 is unique to Rust.\n\nThe asymmetry the table implies: in Ruby/TS/Py/C#, omitting the authorization predicate produces a silent correctness bug — the handler runs without authorization, no compile-time diagnostic. In Rust, the function signature includes `Proof<C>`; omitting the proof is a compile error that names the missing type.\n\nIf you have time, mention §VII-D *Compiler diagnostics* — the Rust error message *names the missing `Proof<C>`*, identifies the function definition, and points at the call site. It is actionable without knowledge of the type theory underneath.'
  },

  // ── Close ────────────────────────────────────────────────────────────────
  {
    section: 'five-langs',
    kind: 'close',
    title: 'Ship it',
    gist: 'Five gems. One paper. One contact.',
    points: [
      '`mcp_authorization` · rubygems · npm · pypi · nuget · crates.io',
      'Paper: noninterference proof, type-state encoding, evaluation across five languages',
      '`github.com/onboardiq/mcp_authorization`',
      'andrew.gauger@fountain.com · @andygauge'
    ],
    duration: 0,
    notes:
      'Leave this slide up during Q&A. The QR stays live, the links are visible, anyone who wants the gem or the paper can scan and go.'
  }
];

// Attach slide number and the cumulative target window for the timer.
let cumulative = 0;
export const flat = raw.map((s, i) => {
  const targetStart = cumulative;
  cumulative += s.duration;
  const num = String(i + 1).padStart(2, '0');
  return { ...s, num, orderIndex: i, targetStart, targetEnd: cumulative };
});

export const TALK_MINUTES = 25;

export function sectionOf(id) {
  return sections.find((s) => s.id === id);
}

export function next(num) {
  const i = flat.findIndex((s) => s.num === num);
  return i >= 0 && i < flat.length - 1 ? flat[i + 1] : null;
}

export function prev(num) {
  const i = flat.findIndex((s) => s.num === num);
  return i > 0 ? flat[i - 1] : null;
}
