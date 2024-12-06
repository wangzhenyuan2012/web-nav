interface Bookmark {
    id: string;
    title: string;
    url: string;
    description?: string;
    createdAt: string;
}

interface Group {
    id: string;
    name: string;
    bookmarks: Bookmark[];
}