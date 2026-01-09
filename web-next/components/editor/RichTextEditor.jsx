import React, { useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import './RichTextEditor.css';

// Dynamically import ReactQuill to prevent SSR issues (document needed)
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

/**
 * Rich Text Editor Component using Quill
 * @param {object} props - Component props
 * @param {string} props.value - Current content value
 * @param {function} props.onChange - Callback when content changes
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.readOnly - Whether editor is read-only
 * @param {string} props.height - Editor height (default: '300px')
 */
const RichTextEditor = ({
    value,
    onChange,
    placeholder = 'Start typing...',
    readOnly = false,
    height = '300px'
}) => {
    const quillRef = useRef(null);

    // Quill modules configuration
    const modules = useMemo(() => ({
        toolbar: readOnly ? false : [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'font': [] }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'align': [] }],
            ['blockquote', 'code-block'],
            ['link', 'image', 'video'],
            ['clean']
        ],
        clipboard: {
            matchVisual: false
        }
    }), [readOnly]);

    // Quill formats
    const formats = [
        'header', 'font', 'size',
        'bold', 'italic', 'underline', 'strike',
        'color', 'background',
        'script',
        'list', 'bullet', 'indent',
        'direction', 'align',
        'blockquote', 'code-block',
        'link', 'image', 'video'
    ];

    return (
        <div className="rich-text-editor-container" style={{ height }}>
            <ReactQuill
                ref={quillRef}
                theme="snow"
                value={value || ''}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
                readOnly={readOnly}
                style={{ height: `calc(${height} - 42px)` }}
            />
        </div>
    );
};

export default RichTextEditor;
