"""
Client HTTP avec retry et gestion d'erreurs pour Newsletter AI
Support pour les flux RSS et APIs web
"""

import aiohttp
import asyncio
import logging
from typing import Dict, Any, Optional, List
from urllib.parse import urljoin, urlparse
import time
from dataclasses import dataclass
import ssl
import certifi

@dataclass
class RetryConfig:
    """Configuration pour les tentatives de retry"""
    max_retries: int = 3
    backoff_factor: float = 1.0
    status_codes_to_retry: List[int] = None
    
    def __post_init__(self):
        if self.status_codes_to_retry is None:
            self.status_codes_to_retry = [429, 500, 502, 503, 504]

class HTTPClient:
    """Client HTTP asynchrone avec retry et gestion d'erreurs"""
    
    def __init__(self, 
                 timeout: int = 30,
                 retry_config: Optional[RetryConfig] = None,
                 user_agent: str = "Newsletter-AI/1.0"):
        self.timeout = aiohttp.ClientTimeout(total=timeout)
        self.retry_config = retry_config or RetryConfig()
        self.user_agent = user_agent
        self.logger = logging.getLogger(__name__)
        
        # Configuration SSL
        self.ssl_context = ssl.create_default_context(cafile=certifi.where())
    
    async def get(self, url: str, **kwargs) -> aiohttp.ClientResponse:
        """Effectue une requÃªte GET avec retry"""
        return await self._request("GET", url, **kwargs)
    
    async def post(self, url: str, **kwargs) -> aiohttp.ClientResponse:
        """Effectue une requÃªte POST avec retry"""
        return await self._request("POST", url, **kwargs)
    
    async def put(self, url: str, **kwargs) -> aiohttp.ClientResponse:
        """Effectue une requÃªte PUT avec retry"""
        return await self._request("PUT", url, **kwargs)
    
    async def delete(self, url: str, **kwargs) -> aiohttp.ClientResponse:
        """Effectue une requÃªte DELETE avec retry"""
        return await self._request("DELETE", url, **kwargs)
    
    async def _request(self, method: str, url: str, **kwargs) -> aiohttp.ClientResponse:
        """MÃ©thode interne pour effectuer une requÃªte avec retry"""
        headers = kwargs.pop('headers', {})
        headers.setdefault('User-Agent', self.user_agent)
        
        for attempt in range(self.retry_config.max_retries + 1):
            try:
                async with aiohttp.ClientSession(
                    timeout=self.timeout,
                    connector=aiohttp.TCPConnector(ssl=self.ssl_context)
                ) as session:
                    self.logger.debug(f"RequÃªte {method} vers {url} (tentative {attempt + 1})")
                    
                    async with session.request(
                        method, url, headers=headers, **kwargs
                    ) as response:
                        
                        # VÃ©rifier si on doit retry
                        if (response.status in self.retry_config.status_codes_to_retry 
                            and attempt < self.retry_config.max_retries):
                            
                            wait_time = self.retry_config.backoff_factor * (2 ** attempt)
                            self.logger.warning(
                                f"Erreur {response.status} pour {url}, "
                                f"retry dans {wait_time}s"
                            )
                            await asyncio.sleep(wait_time)
                            continue
                        
                        # Lecture du contenu pour Ã©viter les warnings
                        content = await response.read()
                        
                        # CrÃ©ation d'une rÃ©ponse avec le contenu
                        mock_response = MockResponse(
                            status=response.status,
                            headers=response.headers,
                            content=content,
                            url=str(response.url)
                        )
                        
                        if response.status >= 400:
                            self.logger.error(f"Erreur HTTP {response.status} pour {url}")
                        
                        return mock_response
                        
            except aiohttp.ClientError as e:
                if attempt < self.retry_config.max_retries:
                    wait_time = self.retry_config.backoff_factor * (2 ** attempt)
                    self.logger.warning(f"Erreur rÃ©seau pour {url}: {e}, retry dans {wait_time}s")
                    await asyncio.sleep(wait_time)
                else:
                    self.logger.error(f"Ã‰chec dÃ©finitif pour {url}: {e}")
                    raise
            
            except asyncio.TimeoutError:
                if attempt < self.retry_config.max_retries:
                    wait_time = self.retry_config.backoff_factor * (2 ** attempt)
                    self.logger.warning(f"Timeout pour {url}, retry dans {wait_time}s")
                    await asyncio.sleep(wait_time)
                else:
                    self.logger.error(f"Timeout dÃ©finitif pour {url}")
                    raise
    
    async def get_json(self, url: str, **kwargs) -> Dict[str, Any]:
        """RÃ©cupÃ¨re du JSON depuis une URL"""
        response = await self.get(url, **kwargs)
        if response.status >= 400:
            raise aiohttp.ClientResponseError(
                request_info=None,
                history=None,
                status=response.status,
                message=f"HTTP {response.status}"
            )
        
        try:
            return await response.json()
        except Exception as e:
            self.logger.error(f"Erreur parsing JSON pour {url}: {e}")
            raise
    
    async def get_text(self, url: str, encoding: str = 'utf-8', **kwargs) -> str:
        """RÃ©cupÃ¨re du texte depuis une URL"""
        response = await self.get(url, **kwargs)
        if response.status >= 400:
            raise aiohttp.ClientResponseError(
                request_info=None,
                history=None,
                status=response.status,
                message=f"HTTP {response.status}"
            )
        
        return await response.text(encoding=encoding)
    
    async def download_file(self, url: str, filepath: str, chunk_size: int = 8192):
        """TÃ©lÃ©charge un fichier depuis une URL"""
        response = await self.get(url)
        
        if response.status >= 400:
            raise aiohttp.ClientResponseError(
                request_info=None,
                history=None,
                status=response.status,
                message=f"HTTP {response.status}"
            )
        
        with open(filepath, 'wb') as f:
            async for chunk in response.content.iter_chunked(chunk_size):
                f.write(chunk)
        
        self.logger.info(f"Fichier tÃ©lÃ©chargÃ©: {filepath}")

class MockResponse:
    """Classe mock pour simuler une rÃ©ponse aiohttp"""
    
    def __init__(self, status: int, headers: Dict, content: bytes, url: str):
        self.status = status
        self.headers = headers
        self._content = content
        self.url = url
    
    async def json(self):
        """Parse le contenu comme JSON"""
        import json
        return json.loads(self._content.decode('utf-8'))
    
    async def text(self, encoding='utf-8'):
        """Retourne le contenu comme texte"""
        return self._content.decode(encoding)
    
    async def read(self):
        """Retourne le contenu brut"""
        return self._content
    
    @property
    def content(self):
        """Simule l'attribut content d'aiohttp"""
        return MockContent(self._content)

class MockContent:
    """Mock pour content.iter_chunked"""
    
    def __init__(self, content: bytes):
        self._content = content
    
    async def iter_chunked(self, chunk_size: int):
        """ItÃ¨re sur le contenu par chunks"""
        for i in range(0, len(self._content), chunk_size):
            yield self._content[i:i + chunk_size]

class RSSClient(HTTPClient):
    """Client spÃ©cialisÃ© pour les flux RSS"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.user_agent = "Newsletter-AI RSS Reader/1.0"
    
    async def fetch_rss(self, url: str) -> str:
        """RÃ©cupÃ¨re un flux RSS"""
        try:
            response = await self.get(url)
            
            if response.status >= 400:
                raise aiohttp.ClientResponseError(
                    request_info=None,
                    history=None,
                    status=response.status,
                    message=f"Erreur RSS {response.status} pour {url}"
                )
            
            content = await response.text()
            self.logger.info(f"RSS rÃ©cupÃ©rÃ©: {url} ({len(content)} caractÃ¨res)")
            return content
            
        except Exception as e:
            self.logger.error(f"Erreur rÃ©cupÃ©ration RSS {url}: {e}")
            raise

class APIClient(HTTPClient):
    """Client spÃ©cialisÃ© pour les APIs REST"""
    
    def __init__(self, base_url: str, api_key: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
    
    def _build_url(self, endpoint: str) -> str:
        """Construit l'URL complÃ¨te"""
        return urljoin(self.base_url + '/', endpoint.lstrip('/'))
    
    def _get_auth_headers(self) -> Dict[str, str]:
        """Retourne les headers d'authentification"""
        headers = {}
        if self.api_key:
            headers['Authorization'] = f'Bearer {self.api_key}'
        return headers
    
    async def api_get(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """GET sur un endpoint API"""
        url = self._build_url(endpoint)
        headers = self._get_auth_headers()
        
        response = await self.get(url, headers=headers, params=params)
        
        if response.status >= 400:
            error_text = await response.text()
            raise aiohttp.ClientResponseError(
                request_info=None,
                history=None,
                status=response.status,
                message=f"API Error {response.status}: {error_text}"
            )
        
        return await response.json()
    
    async def api_post(self, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """POST sur un endpoint API"""
        url = self._build_url(endpoint)
        headers = self._get_auth_headers()
        headers['Content-Type'] = 'application/json'
        
        response = await self.post(url, headers=headers, json=data)
        
        if response.status >= 400:
            error_text = await response.text()
            raise aiohttp.ClientResponseError(
                request_info=None,
                history=None,
                status=response.status,
                message=f"API Error {response.status}: {error_text}"
            )
        
        return await response.json()

# Utilitaires globaux
async def check_url_availability(url: str, timeout: int = 10) -> bool:
    """VÃ©rifie si une URL est accessible"""
    try:
        client = HTTPClient(timeout=timeout)
        response = await client.get(url)
        return response.status < 400
    except Exception:
        return False

async def batch_fetch_urls(urls: List[str], 
                          max_concurrent: int = 10,
                          timeout: int = 30) -> Dict[str, Any]:
    """RÃ©cupÃ¨re plusieurs URLs en parallÃ¨le"""
    
    semaphore = asyncio.Semaphore(max_concurrent)
    client = HTTPClient(timeout=timeout)
    results = {}
    
    async def fetch_one(url: str):
        async with semaphore:
            try:
                response = await client.get(url)
                content = await response.text()
                results[url] = {
                    'status': response.status,
                    'content': content,
                    'success': response.status < 400
                }
            except Exception as e:
                results[url] = {
                    'status': None,
                    'content': None,
                    'success': False,
                    'error': str(e)
                }
    
    tasks = [fetch_one(url) for url in urls]
    await asyncio.gather(*tasks, return_exceptions=True)
    
    return results

