 
import { BlogForm } from "@/components/admin/blog-form";
export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
    return <BlogForm postId={Number((await params).id)} />;
}