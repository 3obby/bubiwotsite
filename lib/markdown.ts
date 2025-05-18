import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Directory where markdown files are stored
const documentsDirectory = path.join(process.cwd(), 'documents');

export function getDocumentBySlug(folder: string, slug: string) {
  const realSlug = slug.replace(/\.md$/, '');
  const fullPath = path.join(documentsDirectory, folder, `${realSlug}.md`);
  
  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    
    return {
      slug: realSlug,
      frontmatter: data,
      content,
    };
  } catch (error) {
    console.error(`Error reading file at ${fullPath}:`, error);
    return {
      slug: realSlug,
      frontmatter: { title: 'Document Not Found', description: 'The requested document could not be found.' },
      content: '# Document Not Found\n\nThe requested document could not be found.',
    };
  }
}

export function getAllDocuments(folder: string) {
  const fullPath = path.join(documentsDirectory, folder);
  
  try {
    const slugs = fs.readdirSync(fullPath)
      .filter((file) => /\.md$/.test(file))
      .map((file) => file.replace(/\.md$/, ''));
    
    const documents = slugs.map((slug) => getDocumentBySlug(folder, slug));
    
    // Sort documents by title
    return documents.sort((a, b) => {
      if (a.frontmatter.title < b.frontmatter.title) return -1;
      if (a.frontmatter.title > b.frontmatter.title) return 1;
      return 0;
    });
  } catch (error) {
    console.error(`Error reading directory at ${fullPath}:`, error);
    return [];
  }
} 