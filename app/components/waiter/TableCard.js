import React from 'react';
import { FiUser } from 'react-icons/fi';

const TableCard = ({ table }) => {
  const isOccupied = table.status === 'occupied';

  return (
    <div className={`rounded-lg sm:rounded-xl lg:rounded-2xl border-2 transition-all duration-200 hover:shadow-md ${
      isOccupied
        ? 'bg-red-50 border-red-200 hover:border-red-300'
        : 'bg-green-50 border-green-200 hover:border-green-300'
    }`}>
      <div className="p-4 text-center">
        <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
          isOccupied ? 'bg-red-100' : 'bg-green-100'
        }`}>
          <FiUser className={`w-6 h-6 ${isOccupied ? 'text-red-600' : 'text-green-600'}`} />
        </div>
        <div className="font-bold text-lg text-gray-900 mb-1">
          Table {table.tableNumber || table.number}
        </div>
        <div className={`text-sm font-medium px-2 py-1 rounded-full ${
          isOccupied
            ? 'bg-red-100 text-red-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {isOccupied ? 'Occupied' : 'Available'}
        </div>
      </div>
    </div>
  );
};

export default TableCard;
