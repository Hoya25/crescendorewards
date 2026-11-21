// Columns of community content that signed-out visitors may read (no submitter account id
// or moderation fields). Must match the column grant for signed-out visitors on content_submissions.
export const PUBLIC_CONTENT_COLUMNS =
  'id, title, description, content_type, media_url, thumbnail_url, source_type, source_name, source_avatar_url, reward_id, status, view_count, is_featured, rating, helpful_count, submitted_at, created_at, updated_at' as const;
