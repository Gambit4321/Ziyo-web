import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import EditPostForm from '@/components/admin/EditPostForm';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EditPostPage(props: Props) {
    const params = await props.params;
    const post = await prisma.post.findUnique({
        where: { id: params.id },
    });

    if (!post) notFound();

    const categories = await prisma.category.findMany();

    return <EditPostForm post={post} categories={categories} />;
}
