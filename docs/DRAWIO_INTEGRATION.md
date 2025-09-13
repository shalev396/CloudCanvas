# Draw.io Integration Guide for Cloud Canvas

This guide provides step-by-step instructions on how to create, save, and embed draw.io diagrams in your Cloud Canvas service pages.

## Table of Contents

- [Overview](#overview)
- [Creating Diagrams](#creating-diagrams)
- [Saving and Hosting Options](#saving-and-hosting-options)
- [Embedding with iframes](#embedding-with-iframes)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Draw.io (now called diagrams.net) is a free, online diagramming tool that allows you to create professional architecture diagrams. We can integrate these diagrams into our service pages using iframes for interactive viewing.

## Creating Diagrams

### Step 1: Access Draw.io

1. Go to [https://app.diagrams.net/](https://app.diagrams.net/)
2. Choose where to save your diagram:
   - **Device** (local storage - for testing)
   - **Google Drive** (recommended for team collaboration)
   - **OneDrive**
   - **GitHub** (for version control)
   - **GitLab**

### Step 2: Choose a Template

1. Select "Create New Diagram"
2. Choose from AWS, Azure, or GCP architecture templates:
   - **AWS Architecture**: Pre-built AWS service icons
   - **Azure**: Microsoft Azure components
   - **GCP**: Google Cloud Platform elements
   - **Basic**: Generic network and system diagrams

### Step 3: Design Your Diagram

1. **Use the left panel** to drag and drop components
2. **AWS-specific tips**:
   - Use the AWS icon library (AWS 19, AWS 17 categories)
   - Follow AWS architecture best practices
   - Include regions, availability zones, and VPCs where relevant
3. **Connect components** using arrows and connectors
4. **Add labels** and descriptions to clarify the flow
5. **Use colors** to group related services or highlight critical paths

### Example: EC2 Architecture Diagram

```
Internet Gateway → Load Balancer → EC2 Instances (Auto Scaling Group) → RDS Database
                                ↓
                              S3 Bucket (Static Assets)
```

## Saving and Hosting Options

### Option 1: Google Drive (Recommended)

1. Save your diagram to Google Drive
2. Set sharing permissions to "Anyone with the link can view"
3. Get the shareable link
4. Convert to embed URL format

### Option 2: GitHub Integration

1. Save diagram directly to your GitHub repository
2. Use GitHub Pages or raw file URLs
3. Benefits: Version control and team collaboration

### Option 3: Self-hosting

1. Export diagram as HTML
2. Upload to your web server or CDN
3. Use the hosted URL for embedding

## Embedding with iframes

### Step 1: Get the Embed URL

#### For Google Drive hosted diagrams:

1. Get the Google Drive sharing link:

   ```
   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
   ```

2. Convert to embed format:
   ```
   https://drive.google.com/file/d/FILE_ID/preview
   ```

#### For diagrams.net hosted diagrams:

1. In diagrams.net, go to File → Embed → iframe
2. Copy the generated iframe code
3. The URL format will be:
   ```
   https://viewer.diagrams.net/?tags=%7B%7D&highlight=0000ff&edit=_blank&layers=1&nav=1&title=your-diagram-name#G{FILE_ID}
   ```

### Step 2: Implement in Cloud Canvas

Add this code to your service page's Architecture Diagrams section:

```tsx
{
  /* Architecture Diagrams Card */
}
<Card className="border-l-4 border-l-amber-500 bg-card/50 backdrop-blur">
  <CardHeader>
    <CardTitle className="text-xl flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
        <span className="text-amber-500 font-semibold text-sm">📊</span>
      </div>
      Architecture Diagrams
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <h4 className="font-semibold text-lg">EC2 Instance Architecture</h4>
      <div className="w-full h-96 border rounded-lg overflow-hidden">
        <iframe
          src="https://viewer.diagrams.net/?tags=%7B%7D&highlight=0000ff&edit=_blank&layers=1&nav=1&title=EC2-Architecture#G{YOUR_FILE_ID}"
          width="100%"
          height="100%"
          frameBorder="0"
          allowFullScreen
          title="EC2 Architecture Diagram"
          className="w-full h-full"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Interactive diagram showing EC2 instance deployment with load balancing
        and auto-scaling.
      </p>
    </div>
  </CardContent>
</Card>;
```

### Step 3: Add Multiple Diagrams

For services with multiple architecture patterns:

```tsx
<div className="space-y-6">
  {/* Basic Architecture */}
  <div>
    <h4 className="font-semibold text-lg mb-2">Basic Architecture</h4>
    <div className="w-full h-80 border rounded-lg overflow-hidden">
      <iframe
        src="YOUR_BASIC_DIAGRAM_URL"
        width="100%"
        height="100%"
        frameBorder="0"
        allowFullScreen
        title="Basic Architecture"
      />
    </div>
  </div>

  {/* Advanced Architecture */}
  <div>
    <h4 className="font-semibold text-lg mb-2">
      High Availability Architecture
    </h4>
    <div className="w-full h-80 border rounded-lg overflow-hidden">
      <iframe
        src="YOUR_ADVANCED_DIAGRAM_URL"
        width="100%"
        height="100%"
        frameBorder="0"
        allowFullScreen
        title="HA Architecture"
      />
    </div>
  </div>
</div>
```

## Best Practices

### Design Guidelines

1. **Keep it simple**: Don't overcrowd diagrams with too many elements
2. **Use consistent colors**: Establish a color scheme for different service types
3. **Add clear labels**: Every component should be clearly labeled
4. **Show data flow**: Use arrows to indicate data direction and flow
5. **Include legends**: For complex diagrams, add a legend explaining symbols

### Technical Considerations

1. **Responsive design**: Ensure diagrams work on mobile devices
2. **Loading states**: Add loading indicators for iframe content
3. **Fallback content**: Provide static images as fallbacks
4. **Accessibility**: Include proper alt text and titles
5. **Performance**: Consider lazy loading for multiple diagrams

### File Organization

```
/diagrams/
  ├── aws/
  │   ├── ec2/
  │   │   ├── basic-architecture.drawio
  │   │   └── ha-architecture.drawio
  │   ├── lambda/
  │   └── rds/
  ├── azure/
  └── gcp/
```

## Advanced Features

### Interactive Elements

- **Clickable components**: Link diagram elements to AWS documentation
- **Layer toggling**: Use draw.io layers to show different scenarios
- **Hover effects**: Add tooltips with additional information

### Dynamic Content

```tsx
const [selectedArchitecture, setSelectedArchitecture] = useState("basic");

const architectures = {
  basic: "YOUR_BASIC_DIAGRAM_URL",
  ha: "YOUR_HA_DIAGRAM_URL",
  serverless: "YOUR_SERVERLESS_DIAGRAM_URL",
};

// Render tabs or buttons to switch between architectures
```

### Custom Styling

```css
.diagram-container {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.diagram-container iframe {
  border: none;
  background: white;
}

/* Dark mode support */
.dark .diagram-container {
  border-color: #374151;
  background: #1f2937;
}
```

## Troubleshooting

### Common Issues

**1. iframe not loading**

- Check if the URL is publicly accessible
- Verify CORS settings
- Ensure the diagram is published correctly

**2. Diagram appears cut off**

- Adjust iframe dimensions
- Check draw.io export settings
- Verify diagram canvas size

**3. Slow loading times**

- Use compressed diagram files
- Implement lazy loading
- Consider caching strategies

### Debugging Steps

1. Test the diagram URL directly in a browser
2. Check browser console for errors
3. Verify network requests in Developer Tools
4. Test on different devices and screen sizes

## Security Considerations

1. **Content Security Policy**: Update CSP headers to allow iframe sources
2. **XSS Protection**: Sanitize any user-generated diagram content
3. **Privacy**: Be mindful of sensitive information in diagrams
4. **Access Control**: Use private repositories for confidential diagrams

## Performance Optimization

1. **Lazy Loading**: Only load diagrams when they come into view
2. **Preloading**: Preload critical diagrams
3. **Caching**: Implement appropriate caching headers
4. **CDN**: Use a CDN for diagram assets
5. **Compression**: Enable gzip compression for diagram files

## Future Enhancements

- **Real-time collaboration**: Multiple users editing diagrams simultaneously
- **Version control**: Track diagram changes over time
- **API integration**: Dynamically update diagrams based on infrastructure changes
- **Export options**: PDF, PNG, SVG export capabilities
- **Template library**: Create reusable diagram templates for common patterns

---

## Quick Start Checklist

- [ ] Create account on diagrams.net
- [ ] Choose storage location (Google Drive recommended)
- [ ] Create your first AWS architecture diagram
- [ ] Set proper sharing permissions
- [ ] Get embed URL
- [ ] Add iframe to service page
- [ ] Test responsiveness
- [ ] Add fallback content
- [ ] Document the diagram

For additional help, visit the [diagrams.net documentation](https://www.diagrams.net/doc/) or check our internal wiki for Cloud Canvas-specific examples.
