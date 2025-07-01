"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import EditDocumentModal from "@/components/EditDocumentModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
// import ThemeChanger from "@/components/ThemeChanger"
import UserProfile from "@/components/UserProfile";
import {
  FileText,
  FolderOpen,
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  Filter,
  BarChart3,
  Users,
  Calendar,
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  fileName: string;
  originalName: string;
  filePath: string;
  cloudinaryUrl?: string;
  cloudinaryId?: string;
  fileSize: number;
  mimeType: string;
  fileExtension: string;
  uploadDate: string;
  mainCategoryId: string;
  subCategoryId?: string;
  mainCategory: {
    id: string;
    name: string;
    nameAr: string;
  };
  subCategory?: {
    id: string;
    name: string;
    nameAr: string;
  };
}

interface Category {
  id: string;
  name: string;
  nameAr: string;
  subCategories: SubCategory[];
  _count: {
    documents: number;
  };
}

interface SubCategory {
  id: string;
  name: string;
  nameAr: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalCategories: 0,
    totalSize: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/admin/login");
      return;
    }
    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      // Fetch documents
      const docsResponse = await fetch("/api/documents");
      const docsData = await docsResponse.json();

      // Fetch categories
      const catsResponse = await fetch("/api/categories");
      const catsData = await catsResponse.json();

      setDocuments(docsData.documents || []);
      setCategories(catsData || []);

      // Calculate stats
      const totalSize = (docsData.documents || []).reduce(
        (sum: number, doc: Document) => sum + doc.fileSize,
        0
      );
      setStats({
        totalDocuments: docsData.documents?.length || 0,
        totalCategories: catsData?.length || 0,
        totalSize,
      });
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDocument = (document: Document) => {
    setSelectedDocument(document);
    setEditModalOpen(true);
  };

  const handleDeleteDocument = (document: Document) => {
    setSelectedDocument(document);
    setDeleteModalOpen(true);
  };

  const handleSaveDocument = (updatedDocument: Document) => {
    setDocuments((prevDocs) =>
      prevDocs.map((doc) =>
        doc.id === updatedDocument.id ? updatedDocument : doc
      )
    );
    setSelectedDocument(null);
  };

  const handleConfirmDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("فشل في حذف الملف");
      }

      // Update local state
      setDocuments((prevDocs) =>
        prevDocs.filter((doc) => doc.id !== documentId)
      );
      setStats((prevStats) => ({
        ...prevStats,
        totalDocuments: prevStats.totalDocuments - 1,
      }));
    } catch (error) {
      alert("حدث خطأ أثناء حذف الملف");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.titleAr.includes(searchTerm);
    const matchesCategory =
      !selectedCategory || doc.mainCategoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-800 font-medium arabic-text">
            جاري التحميل...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 arabic-text">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 h-auto sm:h-16">
            <div className="flex items-center justify-center sm:justify-start">
              <FileText className="h-8 w-8 text-blue-600 ml-3" />
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 arabic-text-lg">
                نظام إدارة الملفات المدرسية
              </h1>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4 mt-2 sm:mt-0 w-full sm:w-auto">
              {/* ThemeChanger أصبح في الهيدر الأساسي */}
              <UserProfile />
              <Button
                variant="outline"
                onClick={() => router.push("/admin/categories")}
                className="gulf-button w-full sm:w-auto py-2 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 bg-white hover:bg-blue-50 border border-blue-200 shadow-sm transition-all"
              >
                <FolderOpen className="h-5 w-5" />
                <span className="hidden xs:inline">إدارة التصنيفات</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/admin/upload")}
                className="gulf-button w-full sm:w-auto py-2 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 shadow-sm transition-all"
              >
                <Plus className="h-5 w-5" />
                <span className="hidden xs:inline">رفع ملف جديد</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-bold text-gray-800 arabic-text-bold">
                  إجمالي الملفات
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalDocuments}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FolderOpen className="h-6 w-6 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-bold text-gray-800 arabic-text-bold">
                  التصنيفات
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalCategories}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-bold text-gray-800 arabic-text-bold">
                  حجم البيانات
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatFileSize(stats.totalSize)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-3 md:space-y-0 md:space-x-4 md:space-x-reverse w-full md:w-auto">
                <div className="relative flex-1 md:w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
                  <input
                    type="text"
                    placeholder="البحث في الملفات..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">جميع التصنيفات</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Button
                  variant="outline"
                  onClick={() => router.push("/admin/categories")}
                >
                  <FolderOpen className="h-4 w-4 ml-2" />
                  إدارة التصنيفات
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              الملفات المرفوعة
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    العنوان
                  </th>
                  <th className="px-2 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التصنيف
                  </th>
                  <th className="px-2 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    حجم الملف
                  </th>
                  <th className="px-2 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاريخ الرفع
                  </th>
                  <th className="px-2 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {doc.titleAr}
                      </div>
                      <div className="text-xs text-gray-500">{doc.title}</div>
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-700">
                      {doc.mainCategory?.nameAr || "غير مصنف"}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(doc.uploadDate).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1 sm:gap-2 justify-start sm:justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditDocument(doc)}
                          aria-label="تعديل الملف"
                          className="flex items-center justify-center min-h-[36px]"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <a
                          href={doc.cloudinaryUrl || doc.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={doc.originalName}
                          className="flex items-center justify-center min-h-[36px] px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
                          aria-label="تنزيل الملف"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc)}
                          aria-label="حذف الملف"
                          className="flex items-center justify-center min-h-[36px]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredDocuments.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      لا توجد ملفات لعرضها.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Document Modal */}
        {editModalOpen && selectedDocument && (
          <EditDocumentModal
            document={selectedDocument}
            onClose={() => {
              setEditModalOpen(false);
            }}
            onSave={(updatedDoc) => {
              // Your save logic here
              setEditModalOpen(false);
            }}
            categories={categories} // You need to provide this array
            isOpen={editModalOpen} // Pass the open state
          />
        )}

        {/* Delete Confirmation Modal */}
        {/* Delete Confirmation Modal */}
        {deleteModalOpen && selectedDocument && (
          <DeleteConfirmModal
            isOpen={deleteModalOpen} // Add this if required
            description={`هل أنت متأكد أنك تريد حذف الملف "${selectedDocument.titleAr}"؟ لا يمكن التراجع عن هذا الإجراء.`}
            confirmText="حذف" // Optional: Custom confirm text
            cancelText="إلغاء" // Optional: Custom cancel text
            onConfirm={async () => {
              await handleConfirmDelete(selectedDocument.id);
              setDeleteModalOpen(false);
              setSelectedDocument(null);
            }}
            onClose={() => {  // Changed from onCancel to onClose
    setDeleteModalOpen(false);
    setSelectedDocument(null);
  }}
          />
        )}
      </main>
    </div>
  );
}
