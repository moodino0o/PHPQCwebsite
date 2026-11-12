
import { useQcReferenceData } from "../hooks/useQcReferenceData";

type Props = {
  category: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
};

export default function QcReferenceSelect({
  category,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  style,
}: Props) {
  const { getItems, loading, error } = useQcReferenceData();

  const items = getItems(category);

  return (
    <select
      value={value}
      disabled={disabled || loading || !!error || items.length === 0}
      onChange={(event) => onChange(event.target.value)}
      style={style}
    >
      <option value="">
        {loading
          ? "Loading database values..."
          : error
            ? "Database connection unavailable"
            : items.length === 0
              ? "No reference values available"
              : placeholder}
      </option>

      {items.map((item) => (
        <option key={item.id} value={item.value}>
          {item.value}
        </option>
      ))}
    </select>
  );
}
