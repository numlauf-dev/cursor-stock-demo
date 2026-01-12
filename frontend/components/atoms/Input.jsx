const Input = ({ 
  type = 'text', 
  value, 
  onChange, 
  placeholder = '', 
  label = '',
  error = '',
  disabled = false,
  min,
  max,
  step,
  className = ''
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={`w-full px-4 py-2 bg-gray-700 border ${
          error ? 'border-red-500' : 'border-gray-600'
        } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}

export default Input
