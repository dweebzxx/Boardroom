import Link from 'next/link';
import { CourseForm } from './CourseForm';
import { Button } from '@/components/ui/button';

export default function NewCoursePage() {
  return (
    <div className="min-h-screen bg-vintage-charcoal text-vintage-cream">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-semibold">Add Course</h1>
            <p className="text-sm text-vintage-cream/60">
              Add course metadata and upload syllabus PDFs for ingestion.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-vintage-slate-blue/40 text-vintage-cream"
          >
            <Link href="/">Back to dashboard</Link>
          </Button>
        </div>
        <CourseForm />
      </div>
    </div>
  );
}
