import { useState } from 'react';

export function usePagination(defaultPageSize: number = 10) {
  const [page, setPage] = useState(1);
  const pageSize = defaultPageSize;
  const [total, setTotal] = useState(0);

  const onPageChange = (newPage: number) => {
    setPage(newPage);
  };

  return { page, pageSize, total, setTotal, onPageChange };
}