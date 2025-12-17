package com.tuntasinaja.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebResourceError;
import android.graphics.Bitmap;
import android.util.Log;
import android.content.pm.PackageManager;
import android.content.pm.PackageInfo;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "TuntasinAja";
    private boolean hasShownError = false;
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Inject versionCode and versionName to JavaScript
        try {
            PackageInfo pInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
            int versionCode = pInfo.versionCode;
            String versionName = pInfo.versionName;
            
            // Inject to window object for JavaScript access
            String injectScript = 
                "(function() {" +
                "  window.__APP_VERSION_CODE__ = " + versionCode + ";" +
                "  window.__APP_VERSION_NAME__ = '" + versionName + "';" +
                "  console.log('[MainActivity] Injected version: code=' + " + versionCode + " + ', name=' + '" + versionName + "');" +
                "})();";
            
            getBridge().getWebView().evaluateJavascript(injectScript, null);
            Log.d(TAG, "Injected versionCode: " + versionCode + ", versionName: " + versionName);
        } catch (PackageManager.NameNotFoundException e) {
            Log.e(TAG, "Error getting package info: " + e.getMessage());
        }
        
        // Get the WebView and add custom error handling
        getBridge().getWebView().setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                hasShownError = false;
            }
            
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                
                // Inject error detection script after page loads
                String errorCheckScript = 
                    "(function() {" +
                    "  function checkAndShowError() {" +
                    "    var bodyText = document.body ? document.body.innerText || document.body.textContent : '';" +
                    "    if (bodyText && ((bodyText.indexOf('\"error\"') !== -1 && bodyText.indexOf('Network request failed') !== -1) || " +
                    "        (bodyText.trim().startsWith('{') && bodyText.indexOf('error') !== -1 && bodyText.length < 200))) {" +
                    "      showErrorPage();" +
                    "      return true;" +
                    "    }" +
                    "    return false;" +
                    "  }" +
                    "  function showErrorPage() {" +
                    "    document.body.innerHTML = '<div style=\"display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:2rem;text-align:center;background:#1a1a2e;color:white;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;\"><div style=\"font-size:4rem;margin-bottom:1rem;\">⚠️</div><h1 style=\"font-size:1.5rem;margin-bottom:0.5rem;font-weight:600;\">Koneksi Gagal</h1><p style=\"color:#a0a0a0;margin-bottom:2rem;font-size:0.95rem;max-width:300px;line-height:1.5;\">Tidak dapat terhubung ke server. Pastikan koneksi internet Anda aktif.</p><button onclick=\"window.location.reload()\" style=\"padding:1rem 2.5rem;background:#ef4444;color:white;border:none;border-radius:0.75rem;font-size:1.1rem;font-weight:600;cursor:pointer;box-shadow:0 4px 15px rgba(239,68,68,0.4);\">🔄 Muat Ulang</button><p style=\"color:#666;margin-top:1.5rem;font-size:0.75rem;\">Klik tombol di atas untuk mencoba lagi</p></div>';" +
                    "    document.body.style.margin = '0';" +
                    "    document.body.style.padding = '0';" +
                    "  }" +
                    "  setTimeout(checkAndShowError, 100);" +
                    "  setTimeout(checkAndShowError, 500);" +
                    "  setTimeout(checkAndShowError, 1000);" +
                    "  document.addEventListener('visibilitychange', function() {" +
                    "    if (!document.hidden) {" +
                    "      setTimeout(checkAndShowError, 100);" +
                    "      setTimeout(checkAndShowError, 500);" +
                    "      setTimeout(checkAndShowError, 1000);" +
                    "      setTimeout(checkAndShowError, 2000);" +
                    "    }" +
                    "  });" +
                    "  setInterval(checkAndShowError, 2000);" +
                    "})();";
                
                view.evaluateJavascript(errorCheckScript, null);
            }
            
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                
                // Only handle main frame errors
                if (request.isForMainFrame() && !hasShownError) {
                    Log.e(TAG, "WebView error: " + error.getDescription());
                    showNetworkErrorPage(view);
                }
            }
            
            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
                super.onReceivedHttpError(view, request, errorResponse);
                
                // Only handle main frame errors with server errors
                if (request.isForMainFrame() && errorResponse.getStatusCode() >= 500 && !hasShownError) {
                    Log.e(TAG, "HTTP error: " + errorResponse.getStatusCode());
                    showNetworkErrorPage(view);
                }
            }
            
            private void showNetworkErrorPage(WebView view) {
                hasShownError = true;
                String errorHtml = "<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width, initial-scale=1.0'></head><body style='display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:2rem;text-align:center;background:#1a1a2e;color:white;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;margin:0;'><div style='font-size:4rem;margin-bottom:1rem;'>⚠️</div><h1 style='font-size:1.5rem;margin-bottom:0.5rem;font-weight:600;'>Koneksi Gagal</h1><p style='color:#a0a0a0;margin-bottom:2rem;font-size:0.95rem;max-width:300px;line-height:1.5;'>Tidak dapat terhubung ke server. Pastikan koneksi internet Anda aktif.</p><button onclick='window.location.reload()' style='padding:1rem 2.5rem;background:#ef4444;color:white;border:none;border-radius:0.75rem;font-size:1.1rem;font-weight:600;cursor:pointer;box-shadow:0 4px 15px rgba(239,68,68,0.4);'>🔄 Muat Ulang</button><p style='color:#666;margin-top:1.5rem;font-size:0.75rem;'>Klik tombol di atas untuk mencoba lagi</p></body></html>";
                view.loadData(errorHtml, "text/html", "UTF-8");
            }
        });
    }
    
    @Override
    public void onResume() {
        super.onResume();
        
        // Re-inject error check script when app resumes from background
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            String resumeCheckScript = 
                "(function() {" +
                "  function checkAndShowError() {" +
                "    var bodyText = document.body ? document.body.innerText || document.body.textContent : '';" +
                "    if (bodyText && ((bodyText.indexOf('\"error\"') !== -1 && bodyText.indexOf('Network request failed') !== -1) || " +
                "        (bodyText.trim().startsWith('{') && bodyText.indexOf('error') !== -1 && bodyText.length < 200))) {" +
                "      showErrorPage();" +
                "      return true;" +
                "    }" +
                "    return false;" +
                "  }" +
                "  function showErrorPage() {" +
                "    document.body.innerHTML = '<div style=\"display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:2rem;text-align:center;background:#1a1a2e;color:white;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;\"><div style=\"font-size:4rem;margin-bottom:1rem;\">⚠️</div><h1 style=\"font-size:1.5rem;margin-bottom:0.5rem;font-weight:600;\">Koneksi Gagal</h1><p style=\"color:#a0a0a0;margin-bottom:2rem;font-size:0.95rem;max-width:300px;line-height:1.5;\">Tidak dapat terhubung ke server. Pastikan koneksi internet Anda aktif.</p><button onclick=\"window.location.reload()\" style=\"padding:1rem 2.5rem;background:#ef4444;color:white;border:none;border-radius:0.75rem;font-size:1.1rem;font-weight:600;cursor:pointer;box-shadow:0 4px 15px rgba(239,68,68,0.4);\">🔄 Muat Ulang</button><p style=\"color:#666;margin-top:1.5rem;font-size:0.75rem;\">Klik tombol di atas untuk mencoba lagi</p></div>';" +
                "    document.body.style.margin = '0';" +
                "    document.body.style.padding = '0';" +
                "  }" +
                "  setTimeout(checkAndShowError, 100);" +
                "  setTimeout(checkAndShowError, 300);" +
                "  setTimeout(checkAndShowError, 500);" +
                "  setTimeout(checkAndShowError, 1000);" +
                "  setTimeout(checkAndShowError, 2000);" +
                "  setTimeout(checkAndShowError, 3000);" +
                "})();";
            
            webView.evaluateJavascript(resumeCheckScript, null);
        }
    }
}
