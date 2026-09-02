import "./styles.css";

export default function ProductOptions({
  sizes,
  selectedSize,
  onSizeChange,
  colors,
  selectedColor,
  onColorChange,
}) {
  return (
    <div className="product-options">
      <div className="product-options__group">
        <h3 className="product-options__label">Tamanho</h3>
        <div className="product-options__sizes">
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              className={
                "product-options__size" +
                (size === selectedSize ? " product-options__size--active" : "")
              }
              onClick={() => onSizeChange(size)}
              aria-pressed={size === selectedSize}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="product-options__group">
        <h3 className="product-options__label">Cor</h3>
        <div className="product-options__colors">
          {colors.map((color) => (
            <button
              key={color.id}
              type="button"
              className={
                "product-options__color" +
                (color.id === selectedColor ? " product-options__color--active" : "")
              }
              style={{ "--swatch": color.hex }}
              onClick={() => onColorChange(color.id)}
              aria-pressed={color.id === selectedColor}
              aria-label={`Cor ${color.id}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}