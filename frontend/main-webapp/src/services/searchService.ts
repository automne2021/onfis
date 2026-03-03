// import axios from 'axios';
import type { SearchResult } from '../components/common/SearchBar';
import { MOCK_SEARCH_RESULTS } from '../data/mockSearchData';


export const fetchResultsFromDB = async (term: string, scope: string): Promise<SearchResult[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500))

  /* (Cái này chỉ dành cho MOCK DATA) */
  /* Xóa hết cái đống này khi sử dụng API */
  const lowerTerm = term.toLowerCase()
  
  return MOCK_SEARCH_RESULTS.filter((item) => {
    const matchScope = item.type === scope;
    const matchTerm = item.title.toLowerCase().startsWith(lowerTerm);
    return matchScope && matchTerm;
  });

  // === USE AXIOS CALL CORRESPONDING API ===
  // const response = await axios.get(`/api/search`, {
  //   params: { q: term, type: scope }
  // });
  // return response.data;
  /* ********************************* */


};