/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// Pages
export interface Page {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  description?: string;
  content?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  featuredImageUrl?: string;
  isPublished: boolean;
  publishDate?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePageInput {
  title: string;
  slug: string;
  description?: string;
  content?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  featuredImageUrl?: string;
  isPublished?: boolean;
  publishDate?: string;
}

export interface UpdatePageInput {
  title?: string;
  slug?: string;
  description?: string;
  content?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  featuredImageUrl?: string;
  isPublished?: boolean;
  publishDate?: string;
}

// Blog Posts
export interface BlogPost {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  featuredImageUrl?: string;
  category?: string;
  tags?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  authorId?: string;
  isPublished: boolean;
  publishDate?: string;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlogPostInput {
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  featuredImageUrl?: string;
  category?: string;
  tags?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  isPublished?: boolean;
  publishDate?: string;
}

export interface UpdateBlogPostInput {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  featuredImageUrl?: string;
  category?: string;
  tags?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  isPublished?: boolean;
  publishDate?: string;
}
