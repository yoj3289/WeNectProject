import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, FontFamily, FontSize } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Table as TableIcon,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = '프로젝트에 대한 상세한 설명을 작성해주세요...',
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      FontSize.configure({
        types: ['textStyle'],
      }),
      Color,
      Link.configure({
        openOnClick: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('링크 URL을 입력하세요:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const setColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* 툴바 */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        {/* 폰트 선택 */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <select
            onChange={(e) => {
              const fontFamily = e.target.value;
              if (fontFamily === 'default') {
                editor.chain().focus().unsetFontFamily().run();
              } else {
                editor.chain().focus().setFontFamily(fontFamily).run();
              }
            }}
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-200"
            title="폰트"
          >
            <option value="default">기본 폰트</option>
            <option value="'Malgun Gothic', '맑은 고딕', sans-serif">맑은 고딕</option>
            <option value="'Noto Sans KR', sans-serif">Noto Sans</option>
            <option value="'Nanum Gothic', '나눔고딕', sans-serif">나눔고딕</option>
            <option value="'Nanum Myeongjo', '나눔명조', serif">나눔명조</option>
            <option value="'Batang', '바탕', serif">바탕</option>
            <option value="'Dotum', '돋움', sans-serif">돋움</option>
            <option value="'Gulim', '굴림', sans-serif">굴림</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="'Times New Roman', serif">Times New Roman</option>
            <option value="Georgia, serif">Georgia</option>
          </select>
        </div>

        {/* 폰트 크기 */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <select
            onChange={(e) => {
              const size = e.target.value;
              if (size === 'default') {
                editor.chain().focus().unsetFontSize().run();
              } else {
                editor.chain().focus().setFontSize(size).run();
              }
            }}
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-200"
            title="글씨 크기"
          >
            <option value="default">크기</option>
            <option value="12px">12px</option>
            <option value="14px">14px</option>
            <option value="16px">16px</option>
            <option value="18px">18px</option>
            <option value="20px">20px</option>
            <option value="24px">24px</option>
            <option value="28px">28px</option>
            <option value="32px">32px</option>
            <option value="36px">36px</option>
          </select>
        </div>

        {/* 텍스트 스타일 */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('bold') ? 'bg-gray-300' : ''
            }`}
            title="굵게"
          >
            <Bold size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('italic') ? 'bg-gray-300' : ''
            }`}
            title="기울임"
          >
            <Italic size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('strike') ? 'bg-gray-300' : ''
            }`}
            title="취소선"
          >
            <Strikethrough size={18} />
          </button>
        </div>

        {/* 제목 */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''
            }`}
            title="제목 1"
          >
            <Heading1 size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
            }`}
            title="제목 2"
          >
            <Heading2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''
            }`}
            title="제목 3"
          >
            <Heading3 size={18} />
          </button>
        </div>

        {/* 리스트 */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('bulletList') ? 'bg-gray-300' : ''
            }`}
            title="불릿 리스트"
          >
            <List size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('orderedList') ? 'bg-gray-300' : ''
            }`}
            title="번호 리스트"
          >
            <ListOrdered size={18} />
          </button>
        </div>

        {/* 정렬 */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : ''
            }`}
            title="왼쪽 정렬"
          >
            <AlignLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''
            }`}
            title="가운데 정렬"
          >
            <AlignCenter size={18} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''
            }`}
            title="오른쪽 정렬"
          >
            <AlignRight size={18} />
          </button>
        </div>

        {/* 색상 */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            type="button"
            onClick={() => setColor('#000000')}
            className="w-8 h-8 rounded border border-gray-400"
            style={{ backgroundColor: '#000000' }}
            title="검정"
          />
          <button
            type="button"
            onClick={() => setColor('#EF4444')}
            className="w-8 h-8 rounded border border-gray-400"
            style={{ backgroundColor: '#EF4444' }}
            title="빨강"
          />
          <button
            type="button"
            onClick={() => setColor('#3B82F6')}
            className="w-8 h-8 rounded border border-gray-400"
            style={{ backgroundColor: '#3B82F6' }}
            title="파랑"
          />
          <button
            type="button"
            onClick={() => setColor('#10B981')}
            className="w-8 h-8 rounded border border-gray-400"
            style={{ backgroundColor: '#10B981' }}
            title="초록"
          />
        </div>

        {/* 링크 & 테이블 */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={addLink}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('link') ? 'bg-gray-300' : ''
            }`}
            title="링크 삽입"
          >
            <LinkIcon size={18} />
          </button>
          <button
            type="button"
            onClick={addTable}
            className="p-2 rounded hover:bg-gray-200"
            title="표 삽입"
          >
            <TableIcon size={18} />
          </button>
        </div>
      </div>

      {/* 에디터 영역 */}
      <EditorContent editor={editor} className="bg-white" />
    </div>
  );
};

export default RichTextEditor;
