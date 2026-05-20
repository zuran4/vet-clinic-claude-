import React, { useEffect, useState } from 'react';
import { Package, Save } from 'lucide-react';
import SupplierSelect from '../ui/SupplierSelect';
import { Button } from "../ui/button";
import Modal from '../ui/Modal';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '../ui/Select';
import StockSection from './StockSection';

const CATEGORY_OPTIONS = ['Φάρμακα', 'Τροφή', 'Αξεσουάρ'];

const ProductFormModal = ({ productId, onClose, onSave }) => {
  const [product, setProduct] = useState({
    name: '',
    category: '',
    barcode: '',
    unit: '',
    threshold: 5,
    supplier: '',
    notes: '',
    activeIngredient: '',
    expirationWarningDays: 30,
    expirationDate: '',
    quantity: 0
  });
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(!!productId);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        const data = await res.json();
        console.log('📡 Backend επέστρεψε:', data);
        setProduct({
          ...data,
          activeIngredient: data.activeIngredient || '',
          expirationWarningDays: data.expirationWarningDays || 30,
          expirationDate: data.expirationDate || '',
          stock: data.stock || 0
        });
        setBatches(data.batches || []);
      } catch (err) {
        console.error('❌ Σφάλμα φόρτωσης:', err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) fetchProduct();
  }, [productId]);

  const handleChange = (field, value) => {
    setProduct((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!product.name || !product.category || !product.unit) {
      alert('Συμπλήρωσε όλα τα υποχρεωτικά πεδία.');
      return;
    }

    try {
      const method = productId ? 'PUT' : 'POST';
      const url = productId ? `/api/products/${productId}` : `/api/products`;

      // 🔹 Αντίγραφο state χωρίς άμεση μεταβολή
      const productToSave = {
        ...product,
        expirationDate: product.expirationDate
          ? new Date(product.expirationDate).toISOString()
          : ''
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productToSave)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Σφάλμα αποθήκευσης.');

      // ✅ Αποθήκευση batches (αν είναι "Τροφή")
      if (product.category === 'Τροφή' && result._id) {
        try {
          const resBatches = await fetch(`/api/products/${result._id}/batches`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ batches }),
          });

          if (!resBatches.ok) {
            const errorData = await resBatches.json();
            throw new Error(errorData.message || 'Σφάλμα αποθήκευσης αποθέματος.');
          }
        } catch (err) {
          console.error('❌ Αποθήκευση αποθέματος απέτυχε:', err);
          alert(`❌ Παρτίδες: ${err.message}`);
        }
      }

      alert('✅ Το προϊόν αποθηκεύτηκε.');
      onSave(result);
      onClose();
    } catch (err) {
      console.error(err);
      alert(`❌ ${err.message}`);
    }
  };

  if (loading) return <div className="text-center mt-10">Φόρτωση...</div>;

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-500" />
          {productId ? 'Επεξεργασία Προϊόντος' : 'Νέο Προϊόν'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Όνομα Προϊόντος *</label>
            <input
              type="text"
              value={product.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="border px-3 py-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Κατηγορία *</label>
            <Select
              value={product.category}
              onValueChange={(value) => handleChange('category', value)}
            >
              <SelectTrigger className="border rounded px-3 py-2 text-sm">
                <SelectValue placeholder="Επιλέξτε Κατηγορία" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {product.category === 'Φάρμακα' && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Δραστική Ουσία</label>
              <input
                type="text"
                value={product.activeIngredient}
                onChange={(e) => handleChange('activeIngredient', e.target.value)}
                className="border px-3 py-2 rounded w-full"
              />
            </div>
          )}

          {['Τροφή', 'Φάρμακα'].includes(product.category) && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Ημέρες Προειδοποίησης Λήξης</label>
                <Select
                  value={String(product.expirationWarningDays)}
                  onValueChange={(value) => handleChange('expirationWarningDays', parseInt(value, 10))}
                >
                  <SelectTrigger className="border rounded px-3 py-2 text-sm">
                    <SelectValue placeholder="Επιλέξτε..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 ημέρες</SelectItem>
                    <SelectItem value="30">30 ημέρες</SelectItem>
                    <SelectItem value="60">60 ημέρες</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Ημερομηνία Λήξης</label>
                <input
                  type="date"
                  value={product.expirationDate ? product.expirationDate.split('T')[0] : ''}
                  onChange={(e) => handleChange('expirationDate', e.target.value)}
                  className="border px-3 py-2 rounded w-full"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Μονάδα Μέτρησης *</label>
            <Select
              value={product.unit}
              onValueChange={(value) => handleChange('unit', value)}
            >
              <SelectTrigger className="border rounded px-3 py-2 text-sm">
                <SelectValue placeholder="Επιλέξτε Μονάδα" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="τεμ.">τεμ.</SelectItem>
                <SelectItem value="κιλά">κιλά</SelectItem>
                <SelectItem value="λίτρα">λίτρα</SelectItem>
                <SelectItem value="κουτί">κουτί</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Απόθεμα</label>
            <input
              type="number"
              value={product.quantity}
              onChange={(e) => handleChange('quantity', parseInt(e.target.value, 10))}
              className="border px-3 py-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Προμηθευτής</label>
            <SupplierSelect
              value={product.supplier}
              onChange={(value) => handleChange('supplier', value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Barcode</label>
            <input
              type="text"
              value={product.barcode}
              onChange={(e) => handleChange('barcode', e.target.value)}
              className="border px-3 py-2 rounded w-full"
            />
          </div>
        </div>

        {product.category === 'Τροφή' && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Απόθεμα & Παρτίδες</h3>
            <StockSection batches={batches} onChange={setBatches} />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Ακύρωση
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <Save className="w-4 h-4" />
            Αποθήκευση
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProductFormModal;
