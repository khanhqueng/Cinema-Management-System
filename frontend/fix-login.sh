#!/bin/bash
echo "Fixing LoginPage.tsx..."

# Remove everything after line 150 (where <style jsx> starts) and add proper closing
head -n 149 /Users/khanhpham/Code-Domain/cinema/frontend/src/pages/LoginPage.tsx > /tmp/login-temp.tsx

# Add the closing at the end
cat >> /tmp/login-temp.tsx << 'LOGIN_END'
      </div>
    </div>
  );
};

export default LoginPage;
LOGIN_END

# Add CSS modules import at the top
sed -i '' '4a\
import styles from '"'"'./Auth.module.css'"'"';
' /tmp/login-temp.tsx

# Replace all className references
sed -i '' 's/className="auth-page"/className={styles.authPage}/g' /tmp/login-temp.tsx
sed -i '' 's/className="auth-background"/className={styles.authBackground}/g' /tmp/login-temp.tsx
sed -i '' 's/className="auth-background-gradient"/className={styles.authBackgroundGradient}/g' /tmp/login-temp.tsx
sed -i '' 's/className="auth-container"/className={styles.authContainer}/g' /tmp/login-temp.tsx
sed -i '' 's/className="auth-form-wrapper"/className={styles.authFormWrapper}/g' /tmp/login-temp.tsx
sed -i '' 's/className="auth-header"/className={styles.authHeader}/g' /tmp/login-temp.tsx
sed -i '' 's/className="auth-form"/className={styles.authForm}/g' /tmp/login-temp.tsx
sed -i '' 's/className="alert alert-error"/className={`${styles.alert} ${styles.alertError}`}/g' /tmp/login-temp.tsx
sed -i '' 's/className="form-group"/className={styles.formGroup}/g' /tmp/login-temp.tsx
sed -i '' 's/className="form-input"/className={styles.formInput}/g' /tmp/login-temp.tsx
sed -i '' 's/className="password-input-wrapper"/className={styles.passwordInputWrapper}/g' /tmp/login-temp.tsx
sed -i '' 's/className="password-toggle"/className={styles.passwordToggle}/g' /tmp/login-temp.tsx
sed -i '' 's/className="form-options"/className={styles.formOptions}/g' /tmp/login-temp.tsx
sed -i '' 's/className="checkbox-label"/className={styles.checkboxLabel}/g' /tmp/login-temp.tsx
sed -i '' 's/className="checkbox-input"/className={styles.checkboxInput}/g' /tmp/login-temp.tsx
sed -i '' 's/className="checkbox-text"/className={styles.checkboxText}/g' /tmp/login-temp.tsx
sed -i '' 's/className="forgot-link"/className={styles.forgotLink}/g' /tmp/login-temp.tsx
sed -i '' 's/className="btn btn-primary btn-large btn-full"/className={`btn ${styles.btnPrimary} btn-large ${styles.btnFull}`}/g' /tmp/login-temp.tsx
sed -i '' 's/className="auth-footer"/className={styles.authFooter}/g' /tmp/login-temp.tsx
sed -i '' 's/className="auth-link"/className={styles.authLink}/g' /tmp/login-temp.tsx

# Move to final location
mv /tmp/login-temp.tsx /Users/khanhpham/Code-Domain/cinema/frontend/src/pages/LoginPage.tsx

echo "LoginPage.tsx fixed!"
