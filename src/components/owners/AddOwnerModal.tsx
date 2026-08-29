import React, { useState } from 'react';
import { 
  UserPlus, 
  X, 
  Building, 
  Phone, 
  Mail, 
  Home, 
  CheckCircle2 
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

interface AddOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddOwnerModal: React.FC<AddOwnerModalProps> = ({ isOpen, onClose }) => {
  const { addOwner, currentUser } = useCrm();

  const [name, setName] = useState('');
  const [coOwner, setCoOwner] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [alternatePhone1, setAlternatePhone1] = useState('');
  const [email, setEmail] = useState('');
  const [project, setProject] = useState('Prestige Falcon City');
  const [block, setBlock] = useState('Tower 1');
  const [flatNumber, setFlatNumber] = useState('');
  const [bhk, setBhk] = useState('3 BHK');
  const [superBuiltUpArea, setSuperBuiltUpArea] = useState('1550');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !primaryPhone || !flatNumber) return;

    addOwner({
      name,
      coOwner: coOwner || undefined,
      primaryPhone,
      alternatePhone1: alternatePhone1 || undefined,
      email: email || undefined,
      project,
      block,
      flatNumber,
      bhk,
      superBuiltUpArea: Number(superBuiltUpArea) || 1500,
      assignedStaff: currentUser.name
    });

    onClose();
    setName('');
    setCoOwner('');
    setPrimaryPhone('');
    setAlternatePhone1('');
    setEmail('');
    setFlatNumber('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-amber-500" />
            <h2 className="text-base font-bold">Add New Prestige Property Owner</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Primary Owner Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Chandra"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Co-Owner / Spouse Name</label>
              <input
                type="text"
                value={coOwner}
                onChange={(e) => setCoOwner(e.target.value)}
                placeholder="e.g. Sunita Chandra"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Primary Phone Number *</label>
              <input
                type="text"
                required
                value={primaryPhone}
                onChange={(e) => setPrimaryPhone(e.target.value)}
                placeholder="+91 98450 XXXXX"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Alternate Phone 1</label>
              <input
                type="text"
                value={alternatePhone1}
                onChange={(e) => setAlternatePhone1(e.target.value)}
                placeholder="+91 98451 XXXXX"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@example.com"
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
            />
          </div>

          <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Prestige Project *</label>
              <input
                type="text"
                required
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Block / Tower *</label>
              <input
                type="text"
                required
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Flat / Unit No *</label>
              <input
                type="text"
                required
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                placeholder="e.g. 1402"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">BHK Config</label>
              <select
                value={bhk}
                onChange={(e) => setBhk(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
              >
                <option value="1 BHK">1 BHK</option>
                <option value="2 BHK">2 BHK</option>
                <option value="2.5 BHK">2.5 BHK</option>
                <option value="3 BHK">3 BHK</option>
                <option value="3.5 BHK">3.5 BHK</option>
                <option value="4 BHK">4 BHK</option>
                <option value="Penthouse">Penthouse / Villa</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Super Area (Sq.Ft)</label>
              <input
                type="number"
                value={superBuiltUpArea}
                onChange={(e) => setSuperBuiltUpArea(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs"
            >
              Save Owner Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
