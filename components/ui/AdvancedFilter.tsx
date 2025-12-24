"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FilterIcon,
  XIconSmall,
  CheckIcon,
  CalendarIcon,
  ClockIcon,
  BookIcon,
} from "./Icons";

export type FilterType = "deadline" | "newest" | "subject";

export interface FilterOption {
  type: FilterType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export interface AdvancedFilterValue {
  type: FilterType;
  subjectValue?: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  {
    type: "deadline",
    label: "Deadline",
    icon: <CalendarIcon size={18} />,
    description: "Urutkan berdasarkan deadline terdekat",
  },
  {
    type: "newest",
    label: "Terbaru",
    icon: <ClockIcon size={18} />,
    description: "Urutkan berdasarkan yang paling baru dibuat",
  },
  {
    type: "subject",
    label: "Mata Pelajaran",
    icon: <BookIcon size={18} />,
    description: "Filter berdasarkan mata pelajaran tertentu",
  },
];

const MATA_PELAJARAN = [
  "Dasar BC",
  "Bahasa Inggris",
  "Seni Musik",
  "Koding dan Kecerdasan Artificial",
  "Matematika",
  "Mulok BK",
  "Mulok Batik",
  "Pendidikan Pancasila",
  "Bahasa Indonesia",
  "Proj IPAS",
  "Sejarah",
  "PJOK",
  "PAI & BP",
  "Informatika",
  // Legacy mata pelajaran (untuk backward compatibility)
  "PAI",
  "Pendidikan Kewarganegaraan Negara",
  "Dasar PPLG",
  "IPAS",
];

interface AdvancedFilterProps {
  value: AdvancedFilterValue;
  onChange?: (value: AdvancedFilterValue) => void;
  placeholder?: string;
  disabled?: boolean;
  availableSubjects?: string[];
}

export default function AdvancedFilter({
  value,
  onChange,
  placeholder = "Pilih Filter",
  disabled = false,
  availableSubjects = MATA_PELAJARAN,
}: AdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSubjectSelection, setShowSubjectSelection] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [mounted, setMounted] = useState(false);

  // Filter subjects based on search query
  const filteredSubjects = availableSubjects.filter((subject) =>
    subject.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Get display value
  const getDisplayValue = () => {
    const filterOption = FILTER_OPTIONS.find((opt) => opt.type === value.type);
    if (!filterOption) return placeholder;

    if (value.type === "subject" && value.subjectValue) {
      return `${filterOption.label}: ${value.subjectValue}`;
    }

    return filterOption.label;
  };

  // Get display icon
  const getDisplayIcon = () => {
    const filterOption = FILTER_OPTIONS.find((opt) => opt.type === value.type);
    return filterOption?.icon || <FilterIcon size={18} />;
  };

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Calculate dropdown position when opened
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      if (buttonRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: buttonRect.bottom + 4,
          left: buttonRect.left,
          width: buttonRect.width,
        });
      }
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  // Handle render and animation state
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsAnimating(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setShowSubjectSelection(false);
        setSelectedFilter(null);
        setSearchQuery("");
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideContainer =
        containerRef.current && !containerRef.current.contains(target);
      const isOutsideDropdown =
        dropdownRef.current && !dropdownRef.current.contains(target);

      if (isOutsideContainer && isOutsideDropdown) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleFilterSelect = (filterType: FilterType) => {
    if (disabled) return;

    if (filterType === "subject") {
      setSelectedFilter(filterType);
      setShowSubjectSelection(true);
      // Focus search input
      requestAnimationFrame(() => {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
      });
    } else {
      onChange?.({ type: filterType });
      setIsOpen(false);
    }
  };

  const handleSubjectSelect = (subject: string) => {
    onChange?.({ type: "subject", subjectValue: subject });
    setIsOpen(false);
  };

  const handleBackToFilters = () => {
    setShowSubjectSelection(false);
    setSelectedFilter(null);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.({ type: "newest" }); // Default to newest
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (disabled) return;
          setIsOpen(!isOpen);
        }}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "0.625rem 0.75rem 0.625rem 2.5rem",
          border: "1px solid var(--border)",
          borderRadius: "0.5rem",
          background: disabled ? "var(--bg-secondary)" : "var(--card)",
          color: disabled ? "var(--text-light)" : "var(--text)",
          fontSize: "0.875rem",
          textAlign: "left",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "all 0.2s",
          minHeight: "42px",
          opacity: disabled ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isOpen && !disabled) {
            e.currentTarget.style.borderColor = "var(--primary)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen && !disabled) {
            e.currentTarget.style.borderColor = "var(--border)";
          }
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flex: 1,
            minWidth: 0,
          }}
        >
          <div style={{ color: "var(--text-light)", flexShrink: 0 }}>
            {getDisplayIcon()}
          </div>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {getDisplayValue()}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            flexShrink: 0,
          }}
        >
          {value.type !== "newest" && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-light)",
                borderRadius: "0.25rem",
                transition: "background 0.2s",
                marginRight: "0.25rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-secondary)";
                e.currentTarget.style.color = "var(--text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.color = "var(--text-light)";
              }}
              aria-label="Reset to newest"
            >
              <XIconSmall size={14} />
            </button>
          )}
          <span
            style={{
              color: "var(--text-light)",
              fontSize: "0.75rem",
              transition: "transform 0.2s",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ▼
          </span>
        </div>
      </button>

      {/* Dropdown */}
      {mounted &&
        shouldRender &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              minWidth: "300px",
              maxHeight: "400px",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              boxShadow: "var(--shadow-lg)",
              zIndex: 10001,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              opacity: isAnimating ? 1 : 0,
              transform: isAnimating ? "translateY(0)" : "translateY(-10px)",
              transition: "opacity 0.2s ease-out, transform 0.2s ease-out",
              pointerEvents: isAnimating ? "auto" : "none",
              visibility: shouldRender ? "visible" : "hidden",
            }}
          >
            {!showSubjectSelection ? (
              // Filter Type Selection
              <>
                <div
                  style={{
                    padding: "1rem",
                    borderBottom: "1px solid var(--border)",
                    background: "var(--bg-secondary)",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--text)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <FilterIcon size={16} />
                    Pilih Jenis Filter
                  </h3>
                </div>
                <div
                  style={{
                    overflowY: "auto",
                    maxHeight: "300px",
                  }}
                >
                  {FILTER_OPTIONS.map((option) => (
                    <button
                      key={option.type}
                      type="button"
                      onClick={() => handleFilterSelect(option.type)}
                      style={{
                        width: "100%",
                        padding: "1rem",
                        border: "none",
                        background:
                          value.type === option.type
                            ? "var(--bg-secondary)"
                            : "transparent",
                        color:
                          value.type === option.type
                            ? "var(--primary)"
                            : "var(--text)",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.75rem",
                        transition: "background 0.15s",
                        borderBottom: "1px solid var(--border)",
                      }}
                      onMouseEnter={(e) => {
                        if (value.type !== option.type) {
                          e.currentTarget.style.background =
                            "var(--bg-secondary)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (value.type !== option.type) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <div
                        style={{
                          color:
                            value.type === option.type
                              ? "var(--primary)"
                              : "var(--text-light)",
                          flexShrink: 0,
                          marginTop: "0.125rem",
                        }}
                      >
                        {option.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: value.type === option.type ? 600 : 500,
                            marginBottom: "0.25rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>{option.label}</span>
                          {value.type === option.type && (
                            <CheckIcon
                              size={16}
                              style={{ color: "var(--primary)", flexShrink: 0 }}
                            />
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-light)",
                            lineHeight: 1.4,
                          }}
                        >
                          {option.description}
                        </div>
                        {option.type === "subject" &&
                          value.type === "subject" &&
                          value.subjectValue && (
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--primary)",
                                marginTop: "0.25rem",
                                fontWeight: 500,
                              }}
                            >
                              Dipilih: {value.subjectValue}
                            </div>
                          )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              // Subject Selection
              <>
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid var(--border)",
                    background: "var(--bg-secondary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleBackToFilters}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "0.25rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-light)",
                      borderRadius: "0.25rem",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--border)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "none";
                    }}
                  >
                    ←
                  </button>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--text)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <BookIcon size={16} />
                    Pilih Mata Pelajaran
                  </h3>
                </div>

                {/* Search Input */}
                <div
                  style={{
                    padding: "0.75rem",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Cari mata pelajaran..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      border: "1px solid var(--border)",
                      borderRadius: "0.375rem",
                      background: "var(--bg-secondary)",
                      color: "var(--text)",
                      fontSize: "0.875rem",
                      outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--primary)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                    }}
                  />
                </div>

                {/* Subject Options */}
                <div
                  style={{
                    overflowY: "auto",
                    maxHeight: "250px",
                  }}
                >
                  {filteredSubjects.length > 0 ? (
                    filteredSubjects.map((subject) => (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => handleSubjectSelect(subject)}
                        style={{
                          width: "100%",
                          padding: "0.75rem 1rem",
                          border: "none",
                          background:
                            value.subjectValue === subject
                              ? "var(--bg-secondary)"
                              : "transparent",
                          color:
                            value.subjectValue === subject
                              ? "var(--primary)"
                              : "var(--text)",
                          fontSize: "0.875rem",
                          textAlign: "left",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          transition: "background 0.15s",
                          fontWeight:
                            value.subjectValue === subject ? 600 : 400,
                        }}
                        onMouseEnter={(e) => {
                          if (value.subjectValue !== subject) {
                            e.currentTarget.style.background =
                              "var(--bg-secondary)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (value.subjectValue !== subject) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        <span>{subject}</span>
                        {value.subjectValue === subject && (
                          <CheckIcon
                            size={16}
                            style={{ color: "var(--primary)", flexShrink: 0 }}
                          />
                        )}
                      </button>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: "1rem",
                        textAlign: "center",
                        color: "var(--text-light)",
                        fontSize: "0.875rem",
                      }}
                    >
                      Tidak ada mata pelajaran yang ditemukan
                    </div>
                  )}
                </div>
              </>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
