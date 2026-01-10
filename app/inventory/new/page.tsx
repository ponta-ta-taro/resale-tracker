import InventoryForm from '@/components/InventoryForm';

export default function NewInventoryPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">在庫新規登録</h1>
            <div className="bg-white p-6 rounded-lg shadow">
                <InventoryForm mode="create" />
            </div>
        </div>
    );
}
