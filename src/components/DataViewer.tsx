import React, { useState } from 'react';

const JsonTree = ({ data, name = 'root', isLast = true }: { data: any, name?: string, isLast?: boolean, key?: React.Key }) => {
  const [expanded, setExpanded] = useState(name === '@graph' || name === 'Knowledge Graph');
  
  const isObject = data !== null && typeof data === 'object';
  const isArray = Array.isArray(data);
  
  if (!isObject) {
    return (
      <div className="flex font-mono text-sm leading-tight">
        <span className="text-black">{name}: </span>
        <span className="text-[#000080] ml-1">
          {typeof data === 'string' ? `"${data}"` : String(data)}
        </span>
        {!isLast && <span className="text-black">,</span>}
      </div>
    );
  }

  const keys = Object.keys(data);
  
  return (
    <div className="font-mono text-sm leading-tight">
      <div className="flex items-center cursor-pointer select-none" onClick={() => setExpanded(!expanded)}>
        <span className="w-3 h-3 inline-flex items-center justify-center border border-gray-600 bg-white mr-1 text-[9px] font-bold leading-none select-none">
          {expanded ? '-' : '+'}
        </span>
        <span className="text-black">{name !== 'root' ? `${name}: ` : ''}</span>
        <span className="text-gray-600">{isArray ? '[' : '{'}</span>
        {!expanded && <span className="text-gray-600">...{isArray ? ']' : '}'}{!isLast ? ',' : ''}</span>}
      </div>
      
      {expanded && (
        <div className="border-l border-dotted border-gray-500 ml-[5px] pl-3 py-0.5">
          {keys.map((key, index) => (
            <JsonTree 
              key={key} 
              name={isArray ? key : key} 
              data={data[key as keyof typeof data]} 
              isLast={index === keys.length - 1} 
            />
          ))}
        </div>
      )}
      {expanded && (
        <div className="ml-[5px]">
          <span className="text-gray-600">{isArray ? ']' : '}'}{!isLast ? ',' : ''}</span>
        </div>
      )}
    </div>
  );
};

export const DataViewer = ({ data }: { data: any }) => {
  return (
    <div className="win98-inset bg-white p-2 h-[60vh] overflow-auto">
      <JsonTree data={data} name="Knowledge Graph" />
    </div>
  );
};
