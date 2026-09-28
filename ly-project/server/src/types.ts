/**
 * Shapes of the existing Mongo documents. These mirror the collections built
 * by the chunking phase (see CHUNKING.md §3 in the LegalRAG-Data repo) — they
 * describe data that already exists, they do not define it.
 */

/** Who is speaking in a chunk. The single most important field in the corpus:
 *  only `court_text` is the court's own words. Presenting `quoted_statute` or
 *  `quoted_case` as a holding is the exact failure the chunking phase exists
 *  to prevent, so this label must survive all the way to the UI. */
export type ContentType =
  | 'court_text'      // the court speaking
  | 'quoted_case'     // another judgment, quoted
  | 'quoted_statute'  // bare provision text
  | 'quoted_other'    // dictionary, foreign court, speech
  | 'editorial';      // SCR headnote — editors, not the court

/** In Indian law a High Court decision does not bind the way a Supreme Court
 *  one does. 1,004 of the 7,722 chunks are High Court. */
export type CourtTier = 'SC' | 'HC' | 'OTHER';

export interface NodeDoc {
  _id: number;
  title: string;
  publishdate?: string;
  docsource?: string;
  bench?: unknown;
  author?: string;
  neutral_citation?: string | null;
  layer?: 'seed' | 'core' | 'periphery' | 'external';
  matched?: boolean;
  s3_pdf_key?: string | null;
  text?: string;
  kanoon_html?: string;
  duplicate_of?: number;
}

export interface EdgeDoc {
  _id?: unknown;
  src: number;
  dst: number;
  via?: 'cite' | 'citedby';
  polarity?: 'pos' | 'neg' | 'neutral' | 'mixed' | null;
  polarity_counts?: { pos: number; neg: number; neutral: number };
}

export interface ChunkDoc {
  _id: string;
  tid: number;
  chunk_seq: number;
  text: string;
  token_count: number;
  para_ids: string[];
  content_type: ContentType;
  section_types: string[];
  section_primary: string;
  chunk_kind: 'body' | 'headnote';
  para_start: number | null;
  para_end: number | null;
  scr_page_start: number | null;
  locator: string | null;
  title: string;
  publishdate: string;
  year: number;
  court: string;
  court_tier: CourtTier;
  layer: string;
  embedding?: number[];
  embedding_model?: string;
}

/** A chunk plus its retrieval provenance, as returned to the client. */
export interface Passage {
  id: string;
  tid: number;
  text: string;
  locator: string | null;
  contentType: ContentType;
  sectionPrimary: string;
  chunkKind: 'body' | 'headnote';
  score: number;
  /** which retriever(s) found it — useful for debugging relevance */
  via: ('vector' | 'text')[];
}

/* ------------------------------------------------------------------------ */
/* Accounts. Unlike everything above, these live in `legalplatform_app` —    */
/* this application's own database — and this application does write them.  */
/* ------------------------------------------------------------------------ */

/** `admin` is never self-selected: it is granted by scripts/createAdmin.ts. */
export type Role = 'citizen' | 'student' | 'lawyer' | 'judge' | 'admin';

/** Lawyers and judges claim a professional identity, so an admin checks it
 *  before those accounts get anything a citizen account does not. */
export type VerificationStatus = 'not_required' | 'pending' | 'verified' | 'rejected';

/** Role-specific fields. Which ones are present depends on `role`. */
export interface RoleDetails {
  // lawyer
  barCouncilId?: string;
  barCouncilState?: string;
  // judge
  courtName?: string;
  designation?: string;
  // student / researcher
  institution?: string;
  programme?: string;
}

export interface UserDoc {
  _id?: import('mongodb').ObjectId;
  email: string;            // stored lower-cased; unique index
  name: string;
  passwordHash: string;     // bcrypt — the password itself is never stored
  role: Role;
  details: RoleDetails;
  city?: string;
  state?: string;
  verification: {
    status: VerificationStatus;
    reviewedBy?: import('mongodb').ObjectId;
    reviewedAt?: Date;
    note?: string;
  };
  /** Bumped on password change so every existing session cookie stops working. */
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

/** A user's named group of saved judgments — for a lawyer, typically one
 *  client matter ("Sharma bail application"). */
export interface FolderDoc {
  _id?: import('mongodb').ObjectId;
  userId: import('mongodb').ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * One judgment a user has saved. Title, year and court are copied from
 * `bail_rag.nodes` at save time so the Saved page is one query, not a join
 * across databases. A judgment can sit in several folders (the same precedent
 * is often relevant to more than one matter), or in none.
 */
export interface SavedCaseDoc {
  _id?: import('mongodb').ObjectId;
  userId: import('mongodb').ObjectId;
  tid: number;
  title: string;
  year: number | null;
  court: string;
  courtTier: CourtTier;
  note: string;
  folderIds: import('mongodb').ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
