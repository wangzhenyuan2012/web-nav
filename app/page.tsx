"use client";

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { PlusCircle, Bookmark, Folder, X, Edit2, ExternalLink, MoreVertical, Loader2 } from 'lucide-react';
import { Dialog } from "@/components/ui/dialog";
import { DialogContent } from "@/components/ui/dialog";
import { DialogHeader } from "@/components/ui/dialog";
import { DialogTitle } from "@/components/ui/dialog";
import { DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { DragHandleButton } from '@atlaskit/pragmatic-drag-and-drop-react-accessibility/drag-handle-button';

const BASE_URL = 'https://nav-web-worker.wangzhenyuanwork.workers.dev/';
const TENANT_ID = 'default';

// Shared styles
const commonStyles = {
  dialogInput: "w-full mt-1 rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
  groupCard: "bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4 hover:shadow-md transition-shadow duration-200",
  bookmarkItem: "flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all group border border-transparent hover:border-gray-200",
  iconButton: "opacity-0 group-hover:opacity-100 ml-2 hover:bg-gray-200",
};

// Reusable Dialog Form Component
const DialogForm = ({ title, isOpen, onOpenChange, fields, onSubmit, submitText }) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 mt-4">
        {fields.map(({ label, ...field }) => (
          <div key={field.id}>
            <Label htmlFor={field.id} className="text-gray-700">{label}</Label>
            {field.type === 'select' ? (
              <select {...field} className={commonStyles.dialogInput}>
                <option value="">{field.placeholder}</option>
                {field.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <Input {...field} className="mt-1" />
            )}
          </div>
        ))}
        <Button onClick={onSubmit} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {submitText}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

// Action Menu Component
const ActionMenu = ({ actions }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm" className={commonStyles.iconButton}>
        <MoreVertical className="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-48">
      {actions.map(({ icon: Icon, label, onClick, danger }) => (
        <DropdownMenuItem 
          key={label}
          onClick={onClick}
          className={\`flex items-center \${danger ? 'text-red-600 focus:text-red-700' : ''}\`}
        >
          <Icon className="w-4 h-4 mr-2" />
          {label}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

// Bookmark Item Component
const BookmarkItem = ({ bookmark, index, groupId }) => {
  const itemRef = React.useRef(null);

  useEffect(() => {
    if (!itemRef.current) return;

    return combine(
      draggable({
        element: itemRef.current,
        getInitialData: () => ({ type: 'bookmark', id: bookmark.id, index, groupId }),
      }),
      dropTargetForElements({
        element: itemRef.current,
        getIsSticky: () => true,
        getData: () => ({ type: 'bookmark', id: bookmark.id, index, groupId }),
      })
    );
  }, [bookmark.id, index, groupId]);

  return (
    <div ref={itemRef} className={commonStyles.bookmarkItem}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <DragHandleButton label={\`Reorder \${bookmark.title}\`} />
        <Bookmark className="w-4 h-4 text-indigo-600 flex-shrink-0" />
        <div className="min-w-0">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-gray-900 hover:text-indigo-600 flex items-center gap-1 truncate"
          >
            {bookmark.title}
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </a>
          {bookmark.description && (
            <p className="text-sm text-gray-500 truncate">{bookmark.description}</p>
          )}
        </div>
      </div>
      <ActionMenu
        actions={[
          { icon: Edit2, label: '编辑书签', onClick: () => {} },
          { icon: X, label: '删除书签', onClick: () => {}, danger: true }
        ]}
      />
    </div>
  );
};

// Group Component
const BookmarkGroup = ({ group, index }) => {
  const groupRef = React.useRef(null);

  useEffect(() => {
    if (!groupRef.current) return;

    return combine(
      draggable({
        element: groupRef.current,
        getInitialData: () => ({ type: 'group', id: group.id, index }),
      }),
      dropTargetForElements({
        element: groupRef.current,
        getIsSticky: () => true,
        getData: () => ({ type: 'group', id: group.id, index }),
      })
    );
  }, [group.id, index]);

  return (
    <div ref={groupRef} className={commonStyles.groupCard}>
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Folder className="w-5 h-5 text-indigo-600" />
          {group.name}
        </h2>
        <ActionMenu
          actions={[
            { icon: Edit2, label: '编辑分组', onClick: () => {} },
            { icon: X, label: '删除分组', onClick: () => {}, danger: true }
          ]}
        />
      </div>
      <div className="space-y-2">
        {group.bookmarks.map((bookmark, idx) => (
          <BookmarkItem
            key={bookmark.id}
            bookmark={bookmark}
            index={idx}
            groupId={group.id}
          />
        ))}
      </div>
    </div>
  );
};

// Main Component
const BookmarkManager = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogState, setDialogState] = useState({
    type: null,
    isOpen: false,
    data: {}
  });

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/${TENANT_ID}`);
        const data = await response.json();
        setGroups(data.groups || []);
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, []);

  const handleSubmit = useCallback(async (type, data) => {
    try {
      await fetch(`${BASE_URL}/api/${TENANT_ID}/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      // Refresh data
      const response = await fetch(`${BASE_URL}/api/${TENANT_ID}`);
      const newData = await response.json();
      setGroups(newData.groups || []);
      setDialogState({ type: null, isOpen: false, data: {} });
    } catch (error) {
      console.error('Error:', error);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-gray-600 font-medium">加载书签中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            我的书签
          </h1>
          <div className="space-x-4">
            <Button
              variant="outline"
              onClick={() => setDialogState({ 
                type: 'group', 
                isOpen: true, 
                data: { name: '' } 
              })}
              className="flex items-center gap-2 hover:bg-gray-100 transition-all"
            >
              <Folder className="w-4 h-4 text-indigo-600" />
              新建分组
            </Button>
            <Button
              onClick={() => setDialogState({ 
                type: 'bookmark', 
                isOpen: true, 
                data: { title: '', url: '', description: '' } 
              })}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusCircle className="w-4 h-4" />
              添加书签
            </Button>
          </div>
        </div>

        {dialogState.isOpen && (
          <DialogForm
            title={dialogState.type === 'group' ? '新建分组' : '添加新书签'}
            isOpen={dialogState.isOpen}
            onOpenChange={(open) => setDialogState(prev => ({ ...prev, isOpen: open }))}
            fields={
              dialogState.type === 'group' 
                ? [
                    { id: 'name', label: '分组名称', placeholder: '输入分组名称', 
                      value: dialogState.data.name,
                      onChange: e => setDialogState(prev => ({
                        ...prev,
                        data: { ...prev.data, name: e.target.value }
                      }))
                    }
                  ]
                : [
                    { id: 'group', type: 'select', label: '选择分组', 
                      options: groups.map(g => ({ value: g.id, label: g.name })),
                      value: dialogState.data.groupId,
                      onChange: e => setDialogState(prev => ({
                        ...prev,
                        data: { ...prev.data, groupId: e.target.value }
                      }))
                    },
                    ...['title', 'url', 'description'].map(field => ({
                      id: field,
                      label: field === 'url' ? 'URL' : field === 'title' ? '标题' : '描述',
                      placeholder: `输入${field === 'url' ? 'URL地址' : field === 'title' ? '书签标题' : '描述信息'}`,
                      value: dialogState.data[field],
                      onChange: e => setDialogState(prev => ({
                        ...prev,
                        data: { ...prev.data, [field]: e.target.value }
                      }))
                    }))
                  ]
            }
            onSubmit={() => handleSubmit(
              dialogState.type === 'group' ? 'groups' : 'bookmarks',
              dialogState.type === 'group' 
                ? { name: dialogState.data.name }
                : { 
                    groupId: dialogState.data.groupId,
                    bookmark: {
                      title: dialogState.data.title,
                      url: dialogState.data.url,
                      description: dialogState.data.description
                    }
                  }
            )}
            submitText={dialogState.type === 'group' ? '创建分组' : '添加书签'}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group, index) => (
            <BookmarkGroup
              key={group.id}
              group={group}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookmarkManager;