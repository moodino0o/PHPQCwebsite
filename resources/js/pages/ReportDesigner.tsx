
import React, { useRef, useState } from "react";
import {
  ArrowLeft, Save, Plus, Type, Minus, Square, Table, Image,
  Calculator, Trash2, X, PanelRightClose, PanelRightOpen, Printer,
} from "lucide-react";

type ElementType = "text" | "line" | "rectangle" | "table" | "image" | "formula";

type DesignElement = {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  color: string;
  background: string;
  bold: boolean;
  align: "left" | "center" | "right";
  tableData?: {
    rows: string[][];
    columnWidths: number[];
  };
};

type Design = {
  page?: {
    size?: string;
    orientation?: string;
    margins?: Record<string, number>;
  };
  elements?: DesignElement[];
};

type Props = {
  initialDesign?: Design;
  templateName?: string;
  onSave: (design: Design) => void;
  onClose: () => void;
};

const createElement = (type: ElementType, count: number): DesignElement => {
  const defaults: Record<ElementType, Partial<DesignElement>> = {
    text: { text: "New Text", width: 250, height: 45, fontSize: 18 },
    line: { text: "", width: 250, height: 3, fontSize: 14 },
    rectangle: { text: "", width: 180, height: 90, fontSize: 14 },
    table: {
      text: "Column 1 | Column 2 | Column 3",
      width: 500,
      height: 150,
      fontSize: 13,
      tableData: {
        rows: [
          ["Column 1", "Column 2", "Column 3"],
          ["", "", ""],
          ["", "", ""],
          ["", "", ""],
        ],
        columnWidths: [33.33, 33.33, 33.34],
      },
    },
    image: { text: "Image Placeholder", width: 180, height: 120, fontSize: 14 },
    formula: { text: "Enter formula", width: 220, height: 45, fontSize: 16 },
  };

  return {
    id: `element-${Date.now()}-${count}`,
    type,
    x: 45,
    y: 50 + count * 15,
    width: 250,
    height: 45,
    text: "",
    fontSize: 18,
    color: "#222222",
    background: "transparent",
    bold: false,
    align: "left",
    ...defaults[type],
  };
};

function getTableData(element: DesignElement) {
  if (element.tableData?.rows?.length) {
    return {
      rows: element.tableData.rows.map((row) => [...row]),
      columnWidths: [...element.tableData.columnWidths],
    };
  }

  const columns = element.text
    ? element.text.split("|").map((column) => column.trim())
    : ["Column 1", "Column 2", "Column 3"];

  return {
    rows: [
      columns,
      ...[1, 2, 3].map(() => columns.map(() => "")),
    ],
    columnWidths: columns.map(() => 100 / columns.length),
  };
}

export default function ReportDesigner({
  initialDesign,
  templateName = "Untitled Report",
  onSave,
  onClose,
}: Props) {
  const [elements, setElements] = useState<DesignElement[]>(
    initialDesign?.elements || []
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [orientation, setOrientation] = useState(
    initialDesign?.page?.orientation || "portrait"
  );
  const [pageSize, setPageSize] = useState(initialDesign?.page?.size || "A4");

  const [drag, setDrag] = useState<{
    id: string;
    startX: number;
    startY: number;
    originalX: number;
    originalY: number;
    originalWidth: number;
    originalHeight: number;
    resizing: boolean;
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const selected = elements.find((element) => element.id === selectedId);

  const canvasWidth = orientation === "landscape" ? 1123 : 794;
  const canvasHeight = orientation === "landscape" ? 794 : 1123;

  function addElement(type: ElementType) {
    const element = createElement(type, elements.length);
    setElements((previous) => [...previous, element]);
    setSelectedId(element.id);
  }

  function updateElement(id: string, changes: Partial<DesignElement>) {
    setElements((previous) =>
      previous.map((element) =>
        element.id === id ? { ...element, ...changes } : element
      )
    );
  }

  function deleteSelected() {
    if (!selectedId) return;
    setElements((previous) =>
      previous.filter((element) => element.id !== selectedId)
    );
    setSelectedId(null);
  }

  function updateTableCell(rowIndex: number, columnIndex: number, value: string) {
    if (!selected || selected.type !== "table") return;

    const data = getTableData(selected);
    data.rows[rowIndex][columnIndex] = value;

    updateElement(selected.id, { tableData: data });
  }

  function addTableRow() {
    if (!selected || selected.type !== "table") return;

    const data = getTableData(selected);
    data.rows.push(data.columnWidths.map(() => ""));

    updateElement(selected.id, {
      tableData: data,
      height: selected.height + 35,
    });
  }

  function deleteTableRow(rowIndex: number) {
    if (!selected || selected.type !== "table") return;

    const data = getTableData(selected);
    if (data.rows.length <= 1) return;

    data.rows.splice(rowIndex, 1);

    updateElement(selected.id, {
      tableData: data,
      height: Math.max(45, selected.height - 35),
    });
  }

  function addTableColumn() {
    if (!selected || selected.type !== "table") return;

    const data = getTableData(selected);
    data.rows = data.rows.map((row) => [...row, ""]);

    const oldWidth = 100 / (data.columnWidths.length + 1);
    data.columnWidths = data.columnWidths.map(() => oldWidth);
    data.columnWidths.push(oldWidth);

    updateElement(selected.id, {
      tableData: data,
      width: selected.width + 60,
    });
  }

  function deleteTableColumn(columnIndex: number) {
    if (!selected || selected.type !== "table") return;

    const data = getTableData(selected);
    if (data.columnWidths.length <= 1) return;

    data.rows = data.rows.map((row) =>
      row.filter((_, index) => index !== columnIndex)
    );
    data.columnWidths.splice(columnIndex, 1);

    const total = data.columnWidths.reduce((sum, width) => sum + width, 0);
    data.columnWidths = data.columnWidths.map((width) => (width / total) * 100);

    updateElement(selected.id, {
      tableData: data,
      width: Math.max(120, selected.width - 60),
    });
  }

  function updateColumnWidth(columnIndex: number, value: number) {
    if (!selected || selected.type !== "table") return;

    const data = getTableData(selected);
    const widths = [...data.columnWidths];
    const nextValue = Math.max(5, Math.min(90, value));
    const remaining = 100 - nextValue;
    const otherTotal = widths.reduce(
      (sum, width, index) => index === columnIndex ? sum : sum + width,
      0
    );

    widths.forEach((width, index) => {
      if (index === columnIndex) {
        widths[index] = nextValue;
      } else {
        widths[index] = otherTotal > 0
          ? (width / otherTotal) * remaining
          : remaining / (widths.length - 1);
      }
    });

    updateElement(selected.id, {
      tableData: { ...data, columnWidths: widths },
    });
  }

  function startMove(
    event: React.PointerEvent,
    element: DesignElement,
    resizing = false
  ) {
    event.stopPropagation();
    event.preventDefault();
    setSelectedId(element.id);

    setDrag({
      id: element.id,
      startX: event.clientX,
      startY: event.clientY,
      originalX: element.x,
      originalY: element.y,
      originalWidth: element.width,
      originalHeight: element.height,
      resizing,
    });

    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function moveElement(event: React.PointerEvent) {
    if (!drag) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    if (drag.resizing) {
      updateElement(drag.id, {
        width: Math.max(40, drag.originalWidth + deltaX),
        height: Math.max(25, drag.originalHeight + deltaY),
      });
    } else {
      updateElement(drag.id, {
        x: Math.max(0, drag.originalX + deltaX),
        y: Math.max(0, drag.originalY + deltaY),
      });
    }
  }

  function saveDesign() {
    onSave({
      page: {
        size: pageSize,
        orientation,
        margins: initialDesign?.page?.margins || {
          top: 20,
          bottom: 20,
          left: 15,
          right: 15,
        },
      },
      elements,
    });
  }

  function renderElement(element: DesignElement) {
    const common: React.CSSProperties = {
      position: "absolute",
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      boxSizing: "border-box",
      color: element.color,
      fontSize: element.fontSize,
      fontWeight: element.bold ? 700 : 400,
      textAlign: element.align,
      userSelect: "none",
    };

    if (element.type === "line") {
      return <div style={{ ...common, borderTop: `2px solid ${element.color}` }} />;
    }

    if (element.type === "rectangle") {
      return (
        <div style={{
          ...common,
          border: `2px solid ${element.color}`,
          background: element.background,
        }}>
          {element.text}
        </div>
      );
    }

    if (element.type === "table") {
      const data = getTableData(element);

      return (
        <table style={{
          ...common,
          tableLayout: "fixed",
          borderCollapse: "collapse",
          border: `1px solid ${element.color}`,
        }}>
          <colgroup>
            {data.columnWidths.map((width, index) => (
              <col key={index} style={{ width: `${width}%` }} />
            ))}
          </colgroup>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, columnIndex) => (
                  <td
                    key={columnIndex}
                    style={{
                      border: `1px solid ${element.color}`,
                      padding: 6,
                      overflowWrap: "break-word",
                      background: rowIndex === 0 ? "#edf2f7" : element.background,
                      fontWeight: rowIndex === 0 ? 700 : element.bold ? 700 : 400,
                      textAlign: element.align,
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (element.type === "image") {
      return (
        <div style={{
          ...common,
          border: "1px dashed #999",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f4f6f8",
        }}>
          <Image size={22} />
          {element.text}
        </div>
      );
    }

    return (
      <div style={{
        ...common,
        display: "flex",
        alignItems: "center",
        padding: 5,
        background: element.background,
      }}>
        {element.type === "formula" ? "ƒ(x) " : ""}
        {element.text}
      </div>
    );
  }

  return (
    <div className="report-designer-root" style={{
      position: "fixed",
      inset: 0,
      zIndex: 2000,
      background: "#edf0f5",
      display: "flex",
      flexDirection: "column",
      color: "#243247",
    }}>
      <style>
        {`
          @page {
            size: A4 ${orientation};
            margin: 0;
          }

          @media print {
            html, body {
              width: 100%;
              height: 100%;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              overflow: visible !important;
            }

            body * {
              visibility: hidden !important;
            }

            .report-designer-root,
            .report-designer-root * {
              visibility: visible !important;
            }

            .report-designer-root {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              right: auto !important;
              bottom: auto !important;
              width: 100% !important;
              height: auto !important;
              min-height: 0 !important;
              display: block !important;
              background: white !important;
              overflow: visible !important;
              z-index: auto !important;
            }

            .report-designer-toolbar,
            .report-designer-sidebar {
              display: none !important;
            }

            .report-designer-workspace {
              display: block !important;
              width: 100% !important;
              height: auto !important;
              min-height: 0 !important;
              padding: 0 !important;
              margin: 0 !important;
              overflow: visible !important;
            }

            .report-designer-canvas {
              position: relative !important;
              display: block !important;
              width: ${orientation === "landscape" ? "297mm" : "210mm"} !important;
              height: ${orientation === "landscape" ? "210mm" : "297mm"} !important;
              min-width: 0 !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              box-shadow: none !important;
              overflow: hidden !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
            }

            .report-designer-canvas button {
              display: none !important;
            }
          }
        `}
      </style>

      <header className="report-designer-toolbar" style={{
        minHeight: 58,
        background: "#fff",
        borderBottom: "1px solid #dce2ea",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 18px",
        gap: 12,
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onClose} style={buttonStyle}>
            <ArrowLeft size={17} /> Back
          </button>
          <strong>{templateName}</strong>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setInspectorOpen(!inspectorOpen)} style={buttonStyle}>
            {inspectorOpen ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />}
            Inspector
          </button>
          <button onClick={saveDesign} style={{ ...buttonStyle, background: "#17365d", color: "#fff" }}>
            <Save size={17} /> Save Design
          </button>
          <button onClick={() => window.print()} style={buttonStyle}>
            <Printer size={17} /> Print / PDF
          </button>
          <button onClick={onClose} style={buttonStyle}>
            <X size={17} />
          </button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
        <aside className="report-designer-sidebar" style={{
          width: 190,
          flexShrink: 0,
          background: "#fff",
          borderRight: "1px solid #dce2ea",
          padding: 13,
          overflowY: "auto",
        }}>
          <strong>Insert Elements</strong>
          <p style={sectionLabel}>CONTENT</p>

          <ToolButton icon={<Type size={17} />} label="Text" onClick={() => addElement("text")} />
          <ToolButton icon={<Minus size={17} />} label="Line" onClick={() => addElement("line")} />
          <ToolButton icon={<Square size={17} />} label="Rectangle" onClick={() => addElement("rectangle")} />
          <ToolButton icon={<Table size={17} />} label="Table" onClick={() => addElement("table")} />
          <ToolButton icon={<Image size={17} />} label="Image" onClick={() => addElement("image")} />
          <ToolButton icon={<Calculator size={17} />} label="Formula" onClick={() => addElement("formula")} />

          <hr style={separatorStyle} />
          <strong>Page Setup</strong>

          <label style={sectionLabel}>PAPER SIZE</label>
          <select value={pageSize} onChange={(event) => setPageSize(event.target.value)} style={fieldStyle}>
            <option value="A4">A4</option>
          </select>

          <label style={sectionLabel}>ORIENTATION</label>
          <select value={orientation} onChange={(event) => setOrientation(event.target.value)} style={fieldStyle}>
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>

          <hr style={separatorStyle} />
          <strong>Layers</strong>

          {elements.map((element, index) => (
            <button
              key={element.id}
              onClick={() => setSelectedId(element.id)}
              style={{
                ...toolButtonStyle,
                background: selectedId === element.id ? "#eaf2ff" : "#fff",
                color: "#344054",
              }}
            >
              {index + 1}. {element.type}
            </button>
          ))}
        </aside>

        <main className="report-designer-workspace" style={{
          flex: 1,
          overflow: "auto",
          padding: 30,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}>
          <div
            ref={canvasRef}
            className="report-designer-canvas"
            onPointerMove={moveElement}
            onPointerUp={() => setDrag(null)}
            onPointerCancel={() => setDrag(null)}
            onPointerDown={() => setSelectedId(null)}
            style={{
              width: canvasWidth,
              height: canvasHeight,
              minWidth: canvasWidth,
              background: "#fff",
              position: "relative",
              boxShadow: "0 3px 18px rgba(0,0,0,.16)",
              overflow: "hidden",
            }}
          >
            {elements.map((element) => (
              <div
                key={element.id}
                onPointerDown={(event) => startMove(event, element)}
                style={{
                  position: "absolute",
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                  outline: selectedId === element.id ? "2px solid #2875d0" : "none",
                }}
              >
                {renderElement(element)}

                {selectedId === element.id && (
                  <button
                    onPointerDown={(event) => startMove(event, element, true)}
                    title="Resize element"
                    style={{
                      position: "absolute",
                      width: 12,
                      height: 12,
                      right: -6,
                      bottom: -6,
                      padding: 0,
                      background: "#2875d0",
                      border: 0,
                      cursor: "nwse-resize",
                      touchAction: "none",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </main>

        {inspectorOpen && (
          <aside className="report-designer-sidebar" style={{
            width: 300,
            flexShrink: 0,
            background: "#fff",
            borderLeft: "1px solid #dce2ea",
            padding: 16,
            overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>Inspector</strong>
              {selected && (
                <button onClick={deleteSelected} style={{ ...buttonStyle, color: "#b42318" }}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {!selected ? (
              <p style={{ color: "#718096", fontSize: 13, marginTop: 18 }}>
                Select an element on the canvas or from Layers to edit its properties.
              </p>
            ) : (
              <>
                <label style={sectionLabel}>ELEMENT TYPE</label>
                <p style={{ fontSize: 13 }}>{selected.type}</p>

                {selected.type === "table" ? (
                  <>
                    <hr style={separatorStyle} />
                    <strong style={{ fontSize: 13 }}>TABLE EDITOR</strong>
                    <p style={{ color: "#718096", fontSize: 12 }}>
                      Edit each cell below. The first row is used as the table header.
                    </p>

                    <button onClick={addTableRow} style={actionButtonStyle}>
                      <Plus size={14} /> Add Row
                    </button>
                    <button onClick={addTableColumn} style={actionButtonStyle}>
                      <Plus size={14} /> Add Column
                    </button>

                    {getTableData(selected).rows.map((row, rowIndex) => (
                      <div key={rowIndex} style={{
                        marginTop: 12,
                        padding: 8,
                        border: "1px solid #e1e6ed",
                        borderRadius: 6,
                      }}>
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 7,
                        }}>
                          <strong style={{ fontSize: 12 }}>
                            {rowIndex === 0 ? "Header Row" : `Row ${rowIndex}`}
                          </strong>
                          <button
                            onClick={() => deleteTableRow(rowIndex)}
                            disabled={getTableData(selected).rows.length <= 1}
                            style={smallDeleteStyle}
                            title="Delete row"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {row.map((cell, columnIndex) => (
                          <div key={columnIndex} style={{ marginTop: 6 }}>
                            <label style={{ ...sectionLabel, marginTop: 5 }}>
                              Column {columnIndex + 1}
                            </label>
                            <input
                              value={cell}
                              onChange={(event) =>
                                updateTableCell(rowIndex, columnIndex, event.target.value)
                              }
                              placeholder="Enter cell content"
                              style={fieldStyle}
                            />
                          </div>
                        ))}
                      </div>
                    ))}

                    <hr style={separatorStyle} />
                    <strong style={{ fontSize: 13 }}>COLUMN WIDTHS</strong>
                    {getTableData(selected).columnWidths.map((width, index) => (
                      <label key={index} style={sectionLabel}>
                        Column {index + 1} ({width.toFixed(1)}%)
                        <input
                          type="number"
                          min="5"
                          max="90"
                          step="1"
                          value={Number(width.toFixed(1))}
                          onChange={(event) =>
                            updateColumnWidth(index, Number(event.target.value))
                          }
                          style={fieldStyle}
                        />
                        <button
                          onClick={() => deleteTableColumn(index)}
                          disabled={getTableData(selected).columnWidths.length <= 1}
                          style={{ ...smallDeleteStyle, marginTop: 5 }}
                        >
                          <Trash2 size={13} /> Delete Column
                        </button>
                      </label>
                    ))}
                  </>
                ) : (
                  <>
                    <label style={sectionLabel}>CONTENT</label>
                    <textarea
                      value={selected.text}
                      onChange={(event) => updateElement(selected.id, { text: event.target.value })}
                      rows={4}
                      style={fieldStyle}
                    />
                  </>
                )}

                <label style={sectionLabel}>FONT SIZE</label>
                <input
                  type="number"
                  min="6"
                  max="100"
                  value={selected.fontSize}
                  onChange={(event) => updateElement(selected.id, { fontSize: Number(event.target.value) })}
                  style={fieldStyle}
                />

                <label style={sectionLabel}>TEXT COLOR</label>
                <input
                  type="color"
                  value={selected.color}
                  onChange={(event) => updateElement(selected.id, { color: event.target.value })}
                  style={fieldStyle}
                />

                <label style={sectionLabel}>BACKGROUND</label>
                <input
                  type="color"
                  value={selected.background === "transparent" ? "#ffffff" : selected.background}
                  onChange={(event) => updateElement(selected.id, { background: event.target.value })}
                  style={fieldStyle}
                />

                <label style={sectionLabel}>ALIGNMENT</label>
                <select
                  value={selected.align}
                  onChange={(event) => updateElement(selected.id, { align: event.target.value as DesignElement["align"] })}
                  style={fieldStyle}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>

                <label style={{ display: "flex", gap: 8, marginTop: 14, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={selected.bold}
                    onChange={(event) => updateElement(selected.id, { bold: event.target.checked })}
                  />
                  Bold text
                </label>

                <hr style={separatorStyle} />
                <strong style={{ fontSize: 13 }}>POSITION & SIZE</strong>

                {(["x", "y", "width", "height"] as const).map((property) => (
                  <label key={property} style={sectionLabel}>
                    {property.toUpperCase()}
                    <input
                      type="number"
                      min="0"
                      value={selected[property]}
                      onChange={(event) =>
                        updateElement(selected.id, { [property]: Number(event.target.value) })
                      }
                      style={fieldStyle}
                    />
                  </label>
                ))}

                <button
                  onClick={deleteSelected}
                  style={{
                    ...buttonStyle,
                    color: "#b42318",
                    marginTop: 18,
                    width: "100%",
                  }}
                >
                  <Trash2 size={16} /> Delete Element
                </button>
              </>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: "9px 12px",
  border: "1px solid #d8dee8",
  borderRadius: 7,
  background: "#fff",
  cursor: "pointer",
  fontSize: 13,
};

const sectionLabel: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "#718096",
  marginTop: 17,
  marginBottom: 7,
  letterSpacing: ".04em",
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: 9,
  border: "1px solid #d8dee8",
  borderRadius: 6,
  boxSizing: "border-box",
  fontSize: 13,
  background: "#fff",
};

const separatorStyle: React.CSSProperties = {
  border: 0,
  borderTop: "1px solid #e5e9ef",
  margin: "18px 0",
};

const toolButtonStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  width: "100%",
  padding: "10px 8px",
  border: 0,
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
  textAlign: "left",
  fontSize: 13,
};

const actionButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "7px 9px",
  margin: "8px 5px 0 0",
  border: "1px solid #d8dee8",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
  fontSize: 12,
};

const smallDeleteStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "5px 7px",
  border: "1px solid #f0c9c6",
  borderRadius: 5,
  background: "#fff",
  color: "#b42318",
  cursor: "pointer",
  fontSize: 11,
};

function ToolButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={toolButtonStyle}>
      {icon}
      {label}
      <Plus size={13} style={{ marginLeft: "auto" }} />
    </button>
  );
}
