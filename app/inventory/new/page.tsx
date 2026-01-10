import InventoryForm from '@/components/InventoryForm';
import AppleMailImporter from '@/components/AppleMailImporter';

export default function NewInventoryPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">在庫新規登録</h1>

            {/* Apple Mail Importer Section */}
            <div className="mb-8">
                <AppleMailImporter />
            </div>

            {/* Manual Entry Form */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold text-gray-900 mb-4">または手動で入力</h2>
                <InventoryForm mode="create" />
            </div>
        </div>
    );
}
