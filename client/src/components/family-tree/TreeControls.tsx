interface TreeControlsProps {
  onSearch: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

const TreeControls = ({ onSearch, onZoomIn, onZoomOut, onReset }: TreeControlsProps) => {
  return (
    <div className="flex space-x-2">
      <button
        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
        onClick={onSearch}
        title="Search Family Tree"
      >
        <i className="fas fa-search"></i>
      </button>
      
      <button
        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
        onClick={onZoomIn}
        title="Zoom In"
      >
        <i className="fas fa-plus"></i>
      </button>
      
      <button
        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
        onClick={onZoomOut}
        title="Zoom Out"
      >
        <i className="fas fa-minus"></i>
      </button>
      
      <button
        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
        onClick={onReset}
        title="Reset View"
      >
        <i className="fas fa-expand"></i>
      </button>
    </div>
  );
};

export default TreeControls;
