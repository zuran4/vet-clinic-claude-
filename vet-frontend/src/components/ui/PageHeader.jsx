import { ArrowLeft } from "lucide-react";
import Button from "./button";

const PageHeader = ({ title, onClose }) => {
  return (
    <div className="flex justify-between items-center mb-6 border-b dark:border-win-border pb-3">
      <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200">{title}</h2>
      {onClose && (
        <Button
          variant="ghost"
          onClick={onClose}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Επιστροφή
        </Button>
      )}
    </div>
  );
};

export default PageHeader;
