package com.divineprog.appreload;

import com.divineprog.appreload.JavaScriptWebView;

import android.os.Bundle;
import android.app.Activity;
import android.view.Menu;

public class MainActivity extends Activity
{
    JavaScriptWebView mWebView;

    @Override
    protected void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        mWebView = new JavaScriptWebView(this);
        //mWebView.loadUrl("file:///android_asset/index.html");
        mWebView.loadUrl("http://192.168.0.242:4042/connect");
        setContentView(mWebView);
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu)
    {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.main, menu);
        return true;
    }

}
