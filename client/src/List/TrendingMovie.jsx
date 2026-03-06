import { useState, useEffect } from 'react';
import Card from '../Components/UI/Card'; 
import { fetchMovies, fetchGenres, IMAGE_URL } from '../API/tmdbAPI';