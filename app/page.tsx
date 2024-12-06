"use client";

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { PlusCircle, Bookmark, Folder, X, Edit2, ExternalLink, MoreVertical, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BASE_URL = 'https://nav-web-worker.wangzhenyuanwork.workers.dev/';
const TENANT_ID = 'default'; // 可以通过登录系统动态获取

const BookmarkManager = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [newBookmark, setNewBookmark] = useState({ title: '', url: '', description: '' });
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [isAddingBookmark, setIsAddingBookmark] = useState(false);

  // 获取数据
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

  useEffect(() => {
    fetchBookmarks();
  }, []);

  // 添加分组
  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const response = await fetch(`${BASE_URL}/api/${TENANT_ID}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName }),
      });
      if (response.ok) {
        fetchBookmarks();
        setNewGroupName('');
        setIsAddingGroup(false);
      }
    } catch (error) {
      console.error('Error adding group:', error);
    }
  };

  // 添加书签
  const handleAddBookmark = async () => {
    if (!newBookmark.title || !newBookmark.url || !selectedGroup) return;
    try {
      const response = await fetch(`${BASE_URL}/api/${TENANT_ID}/bookmarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroup,
          bookmark: newBookmark,
        }),
      });
      if (response.ok) {
        fetchBookmarks();
        setNewBookmark({ title: '', url: '', description: '' });
        setIsAddingBookmark(false);
      }
    } catch (error) {
      console.error('Error adding bookmark:', error);
    }
  };

  // 处理拖拽结束
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const groupIndex = parseInt(source.droppableId);
    const newGroups = [...groups];
    const [removed] = newGroups[groupIndex].bookmarks.splice(source.index, 1);
    newGroups[parseInt(destination.droppableId)].bookmarks.splice(destination.index, 0, removed);
    
    setGroups(newGroups);
    
    // 这里可以添加API调用来持久化排序
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">我的书签</h1>
          <div className="space-x-4">
            <Dialog open={isAddingGroup} onOpenChange={setIsAddingGroup}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  新建分组
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新建分组</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="groupName">分组名称</Label>
                    <Input
                      id="groupName"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="输入分组名称"
                    />
                  </div>
                  <Button onClick={handleAddGroup} className="w-full">
                    创建分组
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddingBookmark} onOpenChange={setIsAddingBookmark}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  添加书签
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>添加新书签</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="groupSelect">选择分组</Label>
                    <select
                      id="groupSelect"
                      className="w-full rounded-md border border-gray-300 p-2"
                      onChange={(e) => setSelectedGroup(e.target.value)}
                    >
                      <option value="">选择分组</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="title">标题</Label>
                    <Input
                      id="title"
                      value={newBookmark.title}
                      onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
                      placeholder="输入书签标题"
                    />
                  </div>
                  <div>
                    <Label htmlFor="url">URL</Label>
                    <Input
                      id="url"
                      value={newBookmark.url}
                      onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })}
                      placeholder="输入URL地址"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">描述</Label>
                    <Input
                      id="description"
                      value={newBookmark.description}
                      onChange={(e) => setNewBookmark({ ...newBookmark, description: e.target.value })}
                      placeholder="输入描述信息"
                    />
                  </div>
                  <Button onClick={handleAddBookmark} className="w-full">
                    添加书签
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group, groupIndex) => (
              <Droppable key={group.id} droppableId={groupIndex.toString()}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-white rounded-lg shadow-sm p-4 space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Folder className="w-5 h-5 text-blue-500" />
                        {group.name}
                      </h2>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Edit2 className="w-4 h-4 mr-2" />
                            编辑分组
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <X className="w-4 h-4 mr-2" />
                            删除分组
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2">
                      {group.bookmarks.map((bookmark, index) => (
                        <Draggable
                          key={bookmark.id}
                          draggableId={bookmark.id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <Bookmark className="w-4 h-4 text-gray-400" />
                                <div>
                                  <a
                                    href={bookmark.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-gray-900 hover:text-blue-600 flex items-center gap-1"
                                  >
                                    {bookmark.title}
                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </a>
                                  {bookmark.description && (
                                    <p className="text-sm text-gray-500">
                                      {bookmark.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem>
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    编辑书签
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <X className="w-4 h-4 mr-2" />
                                    删除书签
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

export default BookmarkManager;