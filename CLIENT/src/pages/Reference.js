
import React, { useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { supabase } from '../../supabaseClient'; // Adjust the path as needed

// Drag handle component
const DragHandle = ({ id, index }) => (
    <Draggable draggableId={id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps} // This applies the draggable props to the container
        >
          {/* This SVG now serves as the drag handle */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            className="cursor-move w-6 h-6"
            {...provided.dragHandleProps}  // Attach drag handle props here
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16"/>
          </svg>
        </div>
      )}
    </Draggable>
  );

const MovieCard = ({ id, title, medium, length, date, synopsis, image, url, onDelete }) => {
    const [open, setOpen] = useState(false);

    const handleIcon = (medium) => {
        switch (medium) {
            case 'Book':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                    </svg>
                  );
            case 'Movie':
                return (
                
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0 1 18 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0 1 18 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 0 1 6 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
                    </svg>
                );
            case 'YouTube':
                return (
                    <svg height="25px" width="25px" viewBox="0 0 461.001 461.001" fill="#000000" xmlns="http://www.w3.org/2000/svg">
                        <path d="M365.257,67.393H95.744C42.866,67.393,0,110.259,0,163.137v134.728 c0,52.878,42.866,95.744,95.744,95.744h269.513c52.878,0,95.744-42.866,95.744-95.744V163.137 C461.001,110.259,418.135,67.393,365.257,67.393z M300.506,237.056l-126.06,60.123c-3.359,1.602-7.239-0.847-7.239-4.568V168.607 c0-3.774,3.982-6.22,7.348-4.514l126.06,63.881C304.363,229.873,304.298,235.248,300.506,237.056z" fill="currentColor"/>
                    </svg>
                  );
            case 'TV':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" />
                    </svg>
                  );
            default:
                return null;
        }
    };

    const handleDelete = async () => {
        const { error } = await supabase.from('media_items').delete().match({ id: id });
        if (error) {
            console.error('Error deleting media item:', error.message);
        } else {
            onDelete(id);
        }
    };
    const imageElement = medium === 'YouTube' ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
            <img src={image} alt={title} style={{ width: '10%', height: 'auto' }} />
        </a>
    ) : (
        <a href={`https://myflixerz.to/search/${title.toLowerCase().replace(/ /g, '-')}-${date ? date.substring(0, 4) : ''}`} target="_blank" rel="noopener noreferrer">
            <img src={image} alt={title} style={{ width: '10%', height: 'auto' }} />
        </a>
    );
    

    return (
        <div className="movie-card p-2 overflow-hidden flex flex-col">
            <div className="movie-card-header w-auto justify-between flex items-center">
                <DragHandle id = {id} index={index} />
                <div className="justify-between flex items-center">
                    <div className="medium-icon pl-3">{handleIcon(medium)}</div>
                    <div className="item-title font-bold float-left px-10 py-3 text-xl text-left">
                        {imageElement}
                        {title} {date ? `(${date})` : ''}
                    </div>
                </div>
                <div className="flex items-center float-right">
                    <button onClick={handleDelete} className="remove-button py-2 pr-5 pl-12">Delete</button>
                    <button onClick={() => setOpen(!open)} className="p-2">{open ? 'Hide Details' : 'Show Details'}</button>
                </div>
            </div>
            {open && (
                <div className="p-4">
                    <p>Date Added: {date}</p>
                    <p>Length: {length}</p>
                    <p>Synopsis: {synopsis}</p>
                </div>
            )}
        </div>
    );
};

export default MovieCard;



// import React, { useEffect, useState } from 'react';
// import { useParams } from 'react-router-dom';
// import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
// import { supabase } from '../supabaseClient';
// import MovieCard from '../components/common/MovieCard';
// import MovieSearch from '../components/common/MovieSearch';
// import YoutubeSearch from '../components/common/YoutubeSearch';
// import ShareWatchlist from '../components/common/ShareWatchlist';
// import { arrayMoveImmutable as arrayMove } from 'array-move';


// const SortableItem = ({ item, index, onDelete }) => (
//   <Draggable draggableId={item.id.toString()} index={index}>
//     {(provided) => (
//       <div
//         ref={provided.innerRef}
//         {...provided.draggableProps}
//         {...provided.dragHandleProps}>
//         <MovieCard
//           key={item.id}
//           id={item.id}
//           title={item.title}
//           medium={item.medium}
//           length={item.length}
//           date={item.release_date.substring(0, 4)}
//           synopsis={item.synopsis}
//           image={item.image}
//           url={item.url}
//           onDelete={() => onDelete(item.id, item.medium)}
//           index={index}
//         />
//       </div>
//     )}
//   </Draggable>
// );

// const SortableList = ({ items, onDelete }) => (
//     <Droppable droppableId="droppable">
//       {(provided) => (
//         <div
//           ref={provided.innerRef}
//           {...provided.droppableProps}>
//           {items.map((item, index) => (
//             <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
//               {(provided) => (
//                 <div
//                   ref={provided.innerRef}
//                   {...provided.draggableProps}
//                   {...provided.dragHandleProps}>
//                   <MovieCard
//                     id={item.id}
//                     title={item.title}
//                     medium={item.medium}
//                     length={item.length}
//                     date={item.release_date.substring(0, 4)}
//                     synopsis={item.synopsis}
//                     image={item.image}
//                     url={item.url}
//                     onDelete={onDelete}
//                     index={index}  // Pass the index here
//                   />
//                 </div>
//               )}
//             </Draggable>
//           ))}
//           {provided.placeholder}
//         </div>
//       )}
//     </Droppable>
//   );
  

// const MediaPage = () => {
//     const [mediaItems, setMediaItems] = useState([]);
//     const [watchlistId, setWatchlistId] = useState('');
//     const [userId, setUserId] = useState('');
//     const { watchlistName } = useParams();

//     useEffect(() => {
//         const fetchSession = async () => {
//             let { data: user } = await supabase.auth.getUser();
//             if (user) {
//                 setUserId(user.id);
//             }
//         };

//         fetchMediaItems();
//         fetchSession();
//     }, [watchlistName]);

//     const fetchMediaItems = async () => {
//         const { data: watchlist } = await supabase
//             .from('watchlists')
//             .select('id')
//             .eq('name', watchlistName)
//             .single();

//         if (watchlist) {
//             setWatchlistId(watchlist.id);
//             const { data: media } = await supabase
//                 .from('media_items')
//                 .select('*')
//                 .eq('watchlist_id', watchlist.id)
//                 .order('order', { ascending: true });

//             setMediaItems(media || []);
//         }
//     };

//     const onSortEnd = async (result) => {
//         if (!result.destination) return;
    
//         const reorderedItems = arrayMove(mediaItems, result.source.index, result.destination.index);
//         setMediaItems(reorderedItems);
    
//         // Since you're using await, the function must be marked as async
//         try {
//             await Promise.all(reorderedItems.map((item, index) => 
//                 supabase.from('media_items').update({ order: index }).match({ id: item.id })
//             ));
//         } catch (error) {
//             console.error('Error updating order on backend:', error);
//             // Optionally rollback to previous state
//             fetchMediaItems();
//         }
//     };
    

//     const onShare = async (friendId) => {
//         if (!watchlistId) {
//             alert('Watchlist ID not available');
//             return;
//         }

//         const { error } = await supabase
//             .from('watchlist_shares')
//             .insert([{
//                 watchlist_id: watchlistId,
//                 shared_with_user_id: friendId,
//                 permission_type: 'edit'
//             }]);

//         if (error) {
//             console.error('Failed to share watchlist:', error.message);
//             alert('Failed to share watchlist.');
//         } else {
//             alert('Watchlist shared successfully!');
//         }
//     };

//     const handleSelectItem = async (item, type) => {
//         let newMedia;
//         if (type === 'youtube') {
//             const videoUrl = `https://www.youtube.com/watch?v=${item.id.videoId}`;
//             const imageUrl = item.snippet.thumbnails.high.url;
//             newMedia = await supabase.from('media_items').insert([{
//                 title: item.snippet.title,
//                 medium: 'YouTube',
//                 watchlist_id: (await supabase.from('watchlists').select('id').eq('name', watchlistName).single()).data.id,
//                 image: imageUrl,
//                 url: videoUrl,  // Storing YouTube video URL
//                 release_date: item.snippet.publishedAt.substring(0, 10),
//                 order: mediaItems.length
//             }])
//             .select();
//         } else { 
//             const imageUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '';
//             newMedia = await supabase.from('media_items').insert([{
//                 title: item.title || item.name,
//                 medium: item.media_type === 'movie' ? 'Movie' : 'TV',
//                 watchlist_id: (await supabase.from('watchlists').select('id').eq('name', watchlistName).single()).data.id,
//                 image: imageUrl,
//                 release_date: item.release_date || '',
//                 order: mediaItems.length
//             }])
//             .select();
//         }
    
//         const { data, error } = newMedia;
//         if (error) {
//             console.error('Failed to add item:', error.message);
//         } else {
//             setMediaItems([...mediaItems, ...data]);
//         }
//     };    

//     const handleDeleteMediaItem = async (deletedId, medium) => {
//         if (window.confirm(`Are you sure you want to delete this ${medium}?`)) {
//             const { error } = await supabase
//                 .from('media_items')
//                 .delete()
//                 .match({ id: deletedId });

//             if (error) {
//                 console.error('Error deleting media item:', error.message);
//             } else {
//                 setMediaItems(currentMediaItems => currentMediaItems.filter(item => item.id !== deletedId));
//             }
//         }
//     };

//     return (
//         <div className="container mx-auto p-4">
//             <h1 className="text-xl font-bold">{`Media in "${watchlistName}"`}</h1>
//             <MovieSearch onSelect={(item) => handleSelectItem(item, 'movie')} />
//             <YoutubeSearch onSelect={(item) => handleSelectItem(item, 'youtube')} />
//             <DragDropContext onDragEnd={onSortEnd}>
//                 <SortableList items={mediaItems} onDelete={(id, medium) => handleDeleteMediaItem(id, medium)} />
//             </DragDropContext>
//             <ShareWatchlist onShare={onShare} userId={userId} />
//         </div>
//     );
// };

// export default MediaPage;
