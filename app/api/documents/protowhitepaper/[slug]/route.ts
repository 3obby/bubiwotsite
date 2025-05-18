import { NextRequest, NextResponse } from 'next/server';
import { getDocumentBySlug } from '../../../../../lib/markdown';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  
  try {
    const document = getDocumentBySlug('protowhitepaper', slug);
    
    return NextResponse.json({
      slug: document.slug,
      frontmatter: document.frontmatter,
      content: document.content,
    });
  } catch (error) {
    console.error(`Error fetching document ${slug}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
} 