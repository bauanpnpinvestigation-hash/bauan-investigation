import React from 'react';
import { ReportSectionDefinition, ReportFieldDefinition } from '../../types/reports';
import { FormField } from './FormField';

interface DynamicReportFieldsProps {
  sections: ReportSectionDefinition[];
  values: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
  errors?: Record<string, string>;
}

export const DynamicReportFields: React.FC<DynamicReportFieldsProps> = ({
  sections,
  values,
  onChange,
  errors = {},
}) => {
  const renderField = (field: ReportFieldDefinition) => {
    const value = values[field.id] !== undefined ? values[field.id] : '';
    const error = errors[field.id];

    switch (field.type) {
      case 'textarea':
        return (
          <FormField
            key={field.id}
            id={field.id}
            labelEn={field.labelEn}
            labelFil={field.labelFil}
            required={field.required}
            helpText={field.helpText}
            error={error}
            className="md:col-span-2"
          >
            <textarea
              id={field.id}
              rows={field.rows || 4}
              value={value}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-xs"
            />
          </FormField>
        );

      case 'select':
        return (
          <FormField
            key={field.id}
            id={field.id}
            labelEn={field.labelEn}
            labelFil={field.labelFil}
            required={field.required}
            helpText={field.helpText}
            error={error}
          >
            <select
              id={field.id}
              value={value}
              onChange={(e) => onChange(field.id, e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-xs"
            >
              <option value="">— Select ({field.labelFil}) —</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>
        );

      case 'date':
        return (
          <FormField
            key={field.id}
            id={field.id}
            labelEn={field.labelEn}
            labelFil={field.labelFil}
            required={field.required}
            helpText={field.helpText}
            error={error}
          >
            <input
              id={field.id}
              type="date"
              value={value}
              onChange={(e) => onChange(field.id, e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-xs"
            />
          </FormField>
        );

      case 'time':
        return (
          <FormField
            key={field.id}
            id={field.id}
            labelEn={field.labelEn}
            labelFil={field.labelFil}
            required={field.required}
            helpText={field.helpText}
            error={error}
          >
            <input
              id={field.id}
              type="time"
              value={value}
              onChange={(e) => onChange(field.id, e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-xs"
            />
          </FormField>
        );

      case 'number':
        return (
          <FormField
            key={field.id}
            id={field.id}
            labelEn={field.labelEn}
            labelFil={field.labelFil}
            required={field.required}
            helpText={field.helpText}
            error={error}
          >
            <input
              id={field.id}
              type="number"
              value={value}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-xs"
            />
          </FormField>
        );

      case 'text':
      default:
        return (
          <FormField
            key={field.id}
            id={field.id}
            labelEn={field.labelEn}
            labelFil={field.labelFil}
            required={field.required}
            helpText={field.helpText}
            error={error}
          >
            {field.suggestions && field.suggestions.length > 0 ? (
              <div className="relative">
                <input
                  id={field.id}
                  type="text"
                  list={`list-${field.id}`}
                  value={value}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-xs"
                />
                <datalist id={`list-${field.id}`}>
                  {field.suggestions.map((sug) => (
                    <option key={sug} value={sug} />
                  ))}
                </datalist>
              </div>
            ) : (
              <input
                id={field.id}
                type="text"
                value={value}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-xs"
              />
            )}
          </FormField>
        );
    }
  };

  return (
    <div className="space-y-8">
      {sections.map((sec, idx) => (
        <section
          key={sec.id}
          className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs"
        >
          <div className="border-b border-slate-200 pb-3 mb-5">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              <span className="text-blue-900 mr-1.5">{String.fromCharCode(65 + idx)}.</span>
              <span>{sec.titleEn}</span>{' '}
              <span className="text-slate-500 font-medium text-sm sm:text-base">
                ({sec.titleFil})
              </span>
            </h3>
            {sec.description && (
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {sec.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {sec.fields.map(renderField)}
          </div>
        </section>
      ))}
    </div>
  );
};
