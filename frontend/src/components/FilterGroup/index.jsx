import "./styles.css";

export default function FilterGroup({
  title,
  options,
  type = "checkbox",
  selected = [],
  onChange,
}) {
  const name = title.toLowerCase().replace(/\s+/g, "-");

  function isChecked(option) {
    return selected.includes(option);
  }

  function handleToggle(option) {
    if (!onChange) return;
    if (type === "radio") {
      onChange([option]);
      return;
    }
    const next = isChecked(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];
    onChange(next);
  }

  return (
    <fieldset className="filter-group">
      <legend className="filter-group__title">{title}</legend>
      <div className="filter-group__options">
        {options.map((option) => (
          <label key={option} className="filter-group__option">
            <input
              type={type}
              name={name}
              checked={isChecked(option)}
              onChange={() => handleToggle(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}