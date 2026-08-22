"""
Pagination classes for Dayflow HRMS.
"""
from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """
    Standard pagination: 20 items per page, configurable via query param, max 100.
    Usage: ?page=2&page_size=50
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100
