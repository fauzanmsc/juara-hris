import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
  value: string | number;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  required?: boolean;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onChange, placeholder, className, style, required }) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value !== undefined && value !== null && value !== '') {
      setDisplayValue(formatNumber(String(value)));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const formatNumber = (val: string) => {
    const numericStr = val.replace(/\D/g, '');
    if (!numericStr) return '';
    return new Intl.NumberFormat('en-US').format(Number(numericStr));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const numericStr = rawVal.replace(/\D/g, '');
    setDisplayValue(formatNumber(numericStr));
    onChange(numericStr);
  };

  return (
    <input
      type="text"
      className={className}
      style={style}
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      required={required}
    />
  );
};

export default CurrencyInput;
